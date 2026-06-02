import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import WebSocket from 'ws';
import { MarketGateway } from './market.gateway';
import { BinanceKlinePayload } from './dto/binance-ws.interface';
import { MarketStreamMessageDTO } from './dto/market-stream.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MarketService implements OnModuleInit, OnModuleDestroy {
  // Теперь храним массив активных подключений
  private binanceSockets: WebSocket[] = [];

  // Список наших основных монет
  private readonly SUPPORTED_SYMBOLS = [
    'btcusdt',
    'ethusdt',
    'bnbusdt',
    'solusdt',
    'xrpusdt',
  ];

  constructor(
    private readonly marketGateway: MarketGateway,
    private readonly httpService: HttpService,
  ) {}

  onModuleInit() {
    // При старте пробегаемся по массиву и подключаемся к каждой монете
    this.SUPPORTED_SYMBOLS.forEach((symbol) => {
      this.connectToBinanceStream(symbol, '1d');
    });
  }

  onModuleDestroy() {
    // Аккуратно закрываем все соединения при выключении сервера
    this.binanceSockets.forEach((ws) => ws.close());
  }

  // Публичный метод, который отдаст список монет контроллеру (в верхнем регистре)
  public getSupportedSymbols(): string[] {
    return this.SUPPORTED_SYMBOLS.map((s) => s.toUpperCase());
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
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=100`;

    // Явно указываем, что Binance возвращает массив массивов, состоящих из строк и чисел
    const response = await firstValueFrom(
      this.httpService.get<(string | number)[][]>(url),
    );

    // Теперь TypeScript знает, что response.data — это массив, и разрешает использовать .map()
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
    this.binanceSockets.push(ws); // Сохраняем в память

    ws.on('open', () => {
      console.log(
        `[Binance WS] Подключено к потоку: ${symbol.toUpperCase()} (${interval})`,
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

      // Шлем в Gateway. Gateway разошлет это фронтенду.
      // Фронтенд сам поймет, к какой монете относится цена, по полю formattedMessage.symbol
      this.marketGateway.broadcastMarketData(formattedMessage);
    });

    ws.on('error', (error) => {
      console.error(`[Binance WS] Ошибка потока ${symbol}:`, error);
    });

    ws.on('close', () => {
      console.log(
        `[Binance WS] Соединение закрыто (${symbol}). Переподключение...`,
      );
      // Удаляем закрытый сокет из массива и пробуем снова через 5 сек
      this.binanceSockets = this.binanceSockets.filter((s) => s !== ws);
      setTimeout(() => this.connectToBinanceStream(symbol, interval), 5000);
    });
  }
}
