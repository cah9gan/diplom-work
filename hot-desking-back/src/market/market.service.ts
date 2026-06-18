import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import WebSocket from 'ws';
import { MarketGateway } from './market.gateway';
import { BinanceKlinePayload } from './dto/binance-ws.interface';
import { MarketStreamMessageDTO } from './dto/market-stream.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SymbolsService } from './symbols.service';
import { PredictService } from '../ai';
import { PriceService } from './price.service';
import { BinanceTicker24h } from './dto';

interface CustomWebSocket extends WebSocket {
  connectionKey?: string;
}

@Injectable()
export class MarketService implements OnModuleInit, OnModuleDestroy {
  private binanceSockets: WebSocket[] = [];

  private activeConnections = new Set<string>();

  private readonly SUPPORTED_INTERVALS = ['1m', '15m', '1h', '1d'];

  constructor(
    private readonly marketGateway: MarketGateway,
    private readonly httpService: HttpService,
    private readonly symbolsService: SymbolsService,
    private readonly predictService: PredictService,
    private readonly priceService: PriceService,
  ) {}

  async onModuleInit() {
    const symbols = await this.symbolsService.getActiveSymbols();

    symbols.forEach((symbol) => {
      this.SUPPORTED_INTERVALS.forEach((interval) => {
        this.connectToBinanceStream(symbol, interval);
      });
    });
  }

  onModuleDestroy() {
    this.binanceSockets.forEach((ws) => ws.close());
  }

  public async getSupportedSymbols(): Promise<string[]> {
    const symbols = await this.symbolsService.getActiveSymbols();
    return symbols.map((s) => s.toUpperCase());
  }

  public getSupportedIntervals(): string[] {
    return [...this.SUPPORTED_INTERVALS];
  }

  public async addTrackedSymbol(symbol: string, name?: string) {
    const newSymbol = await this.symbolsService.addSymbol(symbol, name);

    this.SUPPORTED_INTERVALS.forEach((interval) => {
      this.connectToBinanceStream(newSymbol.symbol, interval);
    });

    return newSymbol;
  }

  public async getHistory(
    symbol: string,
    interval: string = '1d',
  ): Promise<
    {
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }[]
  > {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=1000`;
    const response = await firstValueFrom(
      this.httpService.get<(string | number)[][]>(url),
    );

    return response.data.map((item) => ({
      time: Math.floor(Number(item[0]) / 1000),
      open: parseFloat(String(item[1])),
      high: parseFloat(String(item[2])),
      low: parseFloat(String(item[3])),
      close: parseFloat(String(item[4])),
      volume: parseFloat(String(item[5])),
    }));
  }

  private connectToBinanceStream(symbol: string, interval: string) {
    const connectionKey = `${symbol}_${interval}`;
    if (this.activeConnections.has(connectionKey)) return;

    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`;
    const ws = new WebSocket(wsUrl) as CustomWebSocket;
    ws.connectionKey = connectionKey;

    this.binanceSockets.push(ws);
    this.activeConnections.add(connectionKey);

    ws.on('open', () => {
      console.log(
        `[Binance WS] Підключено: ${symbol.toUpperCase()} (${interval})`,
      );
    });

    ws.on('message', (data: WebSocket.RawData) => {
      const payload = JSON.parse(
        (data as Buffer).toString(),
      ) as BinanceKlinePayload;

      this.priceService.updatePrice(payload.s, parseFloat(payload.k.c));

      const formattedMessage: MarketStreamMessageDTO = {
        symbol: payload.s,
        interval: payload.k.i,
        kline: {
          time: payload.k.t,
          open: parseFloat(payload.k.o),
          high: parseFloat(payload.k.h),
          low: parseFloat(payload.k.l),
          close: parseFloat(payload.k.c),
          volume: parseFloat(payload.k.v),
          isClosed: payload.k.x,
        },
      };

      this.marketGateway.broadcastMarketData(formattedMessage);
    });

    ws.on('error', (error) => {
      console.error(
        `[Binance WS] Помилка потоку ${symbol} (${interval}):`,
        error,
      );
    });

    ws.on('close', () => {
      this.binanceSockets = this.binanceSockets.filter((s) => s !== ws);
      this.activeConnections.delete(connectionKey);

      this.symbolsService
        .checkIsActive(symbol)
        .then((isActive) => {
          if (isActive) {
            console.log(
              `[Binance WS] Перепідключення ${symbol} (${interval})...`,
            );
            setTimeout(
              () => this.connectToBinanceStream(symbol, interval),
              5000,
            );
          }
        })
        .catch((err: unknown) =>
          console.error(
            `[Binance WS] Помилка під час перевірки статусу ${symbol}:`,
            err,
          ),
        );
    });
  }

  public async removeTrackedSymbol(symbol: string) {
    const normalizedSymbol = symbol.toLowerCase().trim();

    await this.symbolsService.deactivateSymbol(normalizedSymbol);

    const socketsToClose = this.binanceSockets.filter((ws) =>
      (ws as CustomWebSocket).connectionKey?.startsWith(`${normalizedSymbol}_`),
    );

    socketsToClose.forEach((ws) => ws.close());
  }

  public async getInstantPrediction(symbol: string, interval: string = '1d') {
    const history = await this.getHistory(symbol, interval);

    if (history.length < 60) {
      return { trend: 'neutral', confidence: 0 };
    }

    const priceBuffer = history.slice(-60).map((h) => h.close);
    const currentPrice = priceBuffer[priceBuffer.length - 1];

    const prediction = await this.predictService.predictLstm(
      priceBuffer,
      currentPrice,
      interval,
    );

    return prediction;
  }

  public async getBulk24hStats(symbols: string[]) {
    if (!symbols || symbols.length === 0) return [];

    const formattedSymbols = JSON.stringify(
      symbols.map((s) => s.toUpperCase()),
    );
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${formattedSymbols}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<BinanceTicker24h[]>(url),
      );

      return response.data.map((ticker) => ({
        symbol: ticker.symbol,
        currentPrice: parseFloat(ticker.lastPrice),
        high24h: parseFloat(ticker.highPrice),
        low24h: parseFloat(ticker.lowPrice),
        priceChangePercent: parseFloat(ticker.priceChangePercent),
      }));
    } catch (error) {
      console.error(
        '[Binance API] Помилка завантаження 24h статистики:',
        error,
      );
      return [];
    }
  }
}
