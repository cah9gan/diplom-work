import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class PriceService {
  private readonly latestPrices = new Map<string, number>();

  // Обновляем цену при получении сообщения от Binance
  updatePrice(symbol: string, price: number) {
    this.latestPrices.set(symbol.toUpperCase(), price);
  }

  // Торговый сервис будет брать цену отсюда (мгновенно!)
  getLatestPrice(symbol: string): number {
    const price = this.latestPrices.get(symbol.toUpperCase());
    if (!price) throw new BadRequestException('Price not available yet');
    return price;
  }
}
