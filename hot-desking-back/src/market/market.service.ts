import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import WebSocket from 'ws';
import { MarketGateway } from './market.gateway';
import { BinanceKlinePayload } from './dto/binance-ws.interface';
import { MarketStreamMessageDTO } from './dto/market-stream.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MarketService implements OnModuleInit, OnModuleDestroy {
  private binanceSockets: WebSocket[] = [];

  private readonly SUPPORTED_SYMBOLS = [
    'btcusdt',
    'ethusdt',
    'bnbusdt',
    'solusdt',
    'xrpusdt',
  ];

  // 👇 ДОБАВИЛИ: Список интервалов (1 минута, 15 минут, 1 час, 1 день)
  private readonly SUPPORTED_INTERVALS = ['1m', '15m', '1h', '1d'];

  constructor(
    private readonly marketGateway: MarketGateway,
    private readonly httpService: HttpService,
  ) {}

  onModuleInit() {
    // 👇 ИЗМЕНИЛИ: Теперь мы для каждой монеты запускаем 4 разных потока времени
    this.SUPPORTED_SYMBOLS.forEach((symbol) => {
      this.SUPPORTED_INTERVALS.forEach((interval) => {
        this.connectToBinanceStream(symbol, interval);
      });
    });
  }

  onModuleDestroy() {
    this.binanceSockets.forEach((ws) => ws.close());
  }

  public getSupportedSymbols(): string[] {
    return this.SUPPORTED_SYMBOLS.map((s) => s.toUpperCase());
  }

  // 👇 ДОБАВИЛИ: Метод, чтобы отдавать фронтенду доступные интервалы
  public getSupportedIntervals(): string[] {
    return [...this.SUPPORTED_INTERVALS];
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
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`;

    const ws = new WebSocket(wsUrl);
    this.binanceSockets.push(ws);

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
        interval: payload.k.i, // 👈 ВАЖНО: Здесь передается интервал ('1m', '1h' и т.д.)
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

    ws.on('close', () => {
      console.log(`[Binance WS] Переподключение ${symbol} (${interval})...`);
      this.binanceSockets = this.binanceSockets.filter((s) => s !== ws);
      setTimeout(() => this.connectToBinanceStream(symbol, interval), 5000);
    });
  }
}
