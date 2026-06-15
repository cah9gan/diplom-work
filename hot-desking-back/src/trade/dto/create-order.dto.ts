export class CreateOrderDTO {
  symbol: string;
  amount: number;
  type: 'BUY' | 'SELL';
  tp?: number;
  sl?: number;
}
