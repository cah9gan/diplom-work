import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class PriceService {
  private readonly latestPrices = new Map<string, number>();

  // Оновлюємо ціну при отриманні повідомлення від Binance
  updatePrice(symbol: string, price: number) {
    this.latestPrices.set(symbol.toUpperCase(), price);
  }

  // 1. Строгий метод для Торговлі (якщло ціни немає — видаємо помилку, торгувати не можна)
  getLatestPrice(symbol: string): number {
    const price = this.latestPrices.get(symbol.toUpperCase());
    if (!price) throw new BadRequestException('Price not available yet');
    return price;
  }

  // 2. М'який метод для портфеля (якщо ціни поки немає — віддаємо 0, щоб сторінка профілю не падала)
  getPrice(symbol: string): number {
    return this.latestPrices.get(symbol.toUpperCase()) || 0;
  }
}
