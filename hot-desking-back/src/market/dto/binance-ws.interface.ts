export interface BinanceKlinePayload {
  e: string; // Тип події (наприклад, "kline")
  E: number; // Час події (в мілісекундах)
  s: string; // Символ наприклад, "BTCUSDT"
  k: {
    t: number; // Час відкриття свічки (в мілісекундах)
    T: number; // Час закриття свічки
    i: string; // Інтервал (наприклад, "1d")
    o: string; // Open (Ціна відкриття)
    c: string; // Close (Ціна закриття)
    h: string; // High (Максимальна ціна)
    l: string; // Low (Мінімальна ціна)
    v: string; // Volume (Обсяг торгов базового активу)
    n: number; // Кількість угод
    x: boolean; // Чи закрита (true - свеча сформирована, false - ще рисується)
  };
}
