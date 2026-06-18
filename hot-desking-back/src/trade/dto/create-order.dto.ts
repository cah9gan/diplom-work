export class CreateOrderDTO {
  symbol: string;
  amount: number;
  type: 'BUY' | 'SELL';
  stopLoss?: number;
  takeProfit?: number;
}
