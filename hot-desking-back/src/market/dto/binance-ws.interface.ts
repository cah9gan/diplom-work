export interface BinanceKlinePayload {
  e: string; // Тип события (например, "kline")
  E: number; // Время события
  s: string; // Символ (например, "BTCUSDT")
  k: {
    t: number; // Время открытия свечи
    T: number; // Время закрытия свечи
    i: string; // Интервал (например, "1d")
    o: string; // Open (Цена открытия)
    c: string; // Close (Цена закрытия)
    h: string; // High (Максимальная цена)
    l: string; // Low (Минимальная цена)
    v: string; // Volume (Объем торгов базового актива)
    n: number; // Количество сделок
    x: boolean; // Закрыта ли свеча? (true - свеча сформирована, false - еще рисуется)
  };
}
