export interface NewsItem {
  id: string;
  title: string;
  content?: string;
  source: 'SYSTEM' | 'CRYPTOPANIC';
  sentiment: 'ANNOUNCEMENT' | 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  publishedAt: Date;
  url?: string;
}
