import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import WebSocket from 'ws';
import { MarketGateway } from './market.gateway';
import { BinanceKlinePayload } from './dto/binance-ws.interface';
import { MarketStreamMessageDTO } from './dto/market-stream.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SymbolsService } from './symbols.service';
import { PredictService } from '../ai';

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
        `[Binance WS] Подключено: ${symbol.toUpperCase()} (${interval})`,
      );
    });

    ws.on('message', (data: WebSocket.RawData) => {
      const payload = JSON.parse(
        (data as Buffer).toString(),
      ) as BinanceKlinePayload;
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
        `[Binance WS] Ошибка потока ${symbol} (${interval}):`,
        error,
      );
    });

    // 👇 ИСПРАВИЛИ: Убрали async и заменили await на классический .then()
    ws.on('close', () => {
      this.binanceSockets = this.binanceSockets.filter((s) => s !== ws);
      this.activeConnections.delete(connectionKey);

      this.symbolsService
        .checkIsActive(symbol)
        .then((isActive) => {
          if (isActive) {
            console.log(
              `[Binance WS] Переподключение ${symbol} (${interval})...`,
            );
            setTimeout(
              () => this.connectToBinanceStream(symbol, interval),
              5000,
            );
          }
        })
        .catch((err: unknown) =>
          console.error(
            `[Binance WS] Ошибка при проверке статуса монеты ${symbol}:`,
            err,
          ),
        );
    });
  }
  public async removeTrackedSymbol(symbol: string) {
    const normalizedSymbol = symbol.toLowerCase().trim();

    // 1. Помечаем в БД как неактивную
    await this.symbolsService.deactivateSymbol(normalizedSymbol);

    // 2. Находим все открытые сокеты для этой монеты и жестко их закрываем
    const socketsToClose = this.binanceSockets.filter((ws) =>
      (ws as CustomWebSocket).connectionKey?.startsWith(`${normalizedSymbol}_`),
    );

    socketsToClose.forEach((ws) => ws.close());
    // Примечание: они не переподключатся, потому что обработчик 'close'
    // проверит БД и увидит, что isActive === false!
  }
  // Получить мгновенный прогноз по запросу (для REST API)
  public async getInstantPrediction(symbol: string, interval: string = '1d') {
    const history = await this.getHistory(symbol, interval);

    // Если истории недостаточно для окна нейросети
    if (history.length < 60) {
      return { trend: 'neutral', confidence: 0 };
    }

    const priceBuffer = history.slice(-60).map((h) => h.close);
    const currentPrice = priceBuffer[priceBuffer.length - 1];

    // 👇 Запрашиваем прогноз, ПЕРЕДАЕМ interval третьим аргументом 👇
    const prediction = await this.predictService.predictLstm(
      priceBuffer,
      currentPrice,
      interval,
    );

    return prediction;
  }
}
