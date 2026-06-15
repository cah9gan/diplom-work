import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class PriceService {
  private readonly latestPrices = new Map<string, number>();

  // Обновляем цену при получении сообщения от Binance
  updatePrice(symbol: string, price: number) {
    this.latestPrices.set(symbol.toUpperCase(), price);
  }

  // 1. Строгий метод для ТОРГОВЛИ (если цены нет — выдаем ошибку, торговать нельзя)
  getLatestPrice(symbol: string): number {
    const price = this.latestPrices.get(symbol.toUpperCase());
    if (!price) throw new BadRequestException('Price not available yet');
    return price;
  }

  // 2. Мягкий метод для ПОРТФЕЛЯ (если цены пока нет — отдаем 0, чтобы страница профиля не падала)
  getPrice(symbol: string): number {
    return this.latestPrices.get(symbol.toUpperCase()) || 0;
  }
}
