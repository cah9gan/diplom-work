export interface NewsItem {
  id: string;
  title: string;
  content?: string; // Текст или ссылка на источник
  source: 'SYSTEM' | 'CRYPTOPANIC'; // Чтобы фронт понимал, системная это новость или внешняя
  sentiment: 'ANNOUNCEMENT' | 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  publishedAt: Date;
  url?: string;
}
