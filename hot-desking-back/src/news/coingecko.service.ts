import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { NewsItem } from './dto';

// 1. Импортируем модуль
import * as RssParserModule from 'rss-parser';

// 2. Строго описываем то, что нам вернет RSS-лента
interface RssItem {
  title?: string;
  link?: string;
  pubDate?: string;
  contentSnippet?: string; // 👈 Добавили поле для превью
  content?: string; // 👈 Или полное поле контента
}

interface RssFeed {
  items: RssItem[];
}

interface ParserInstance {
  parseURL(url: string): Promise<RssFeed>;
}

// 3. Безопасно достаем конструктор парсера (тот самый трюк, скрывающий any от линтера)
const ParserConstructor =
  (RssParserModule as unknown as { default: new () => ParserInstance })
    .default || (RssParserModule as unknown as new () => ParserInstance);

@Injectable()
export class CoinGeckoService implements OnModuleInit {
  private readonly logger = new Logger(CoinGeckoService.name);

  private cachedExternalNews: NewsItem[] = [];
  private readonly REFRESH_INTERVAL = 60 * 60 * 1000; // 1 час

  // 4. Создаем инстанс с нашими строгими типами
  private readonly parser = new ParserConstructor();

  async onModuleInit() {
    this.logger.log('Инициализация RSS-парсера...');
    await this.fetchAndCacheNews();

    setInterval(() => {
      void this.fetchAndCacheNews();
    }, this.REFRESH_INTERVAL);
  }

  public getCachedNews(): NewsItem[] {
    return this.cachedExternalNews;
  }

  private async fetchAndCacheNews(): Promise<void> {
    try {
      this.logger.log('Загрузка новостей через RSS (ForkLog UA)...');

      const feed = await this.parser.parseURL('https://forklog.com.ua/feed/');

      // TypeScript теперь понимает, что news — это RssItem[]
      const news: RssItem[] = feed.items ? feed.items.slice(0, 10) : [];

      const formattedNews: NewsItem[] = news.map((post, index) => {
        const publishedDate = post.pubDate
          ? new Date(post.pubDate)
          : new Date();

        return {
          id: `rss-${index}-${Date.now()}`,
          title: post.title ?? 'Новина без заголовка',
          // 👇 Теперь в контент мы кладем текст превью, а не ссылку
          content:
            post.contentSnippet ||
            post.content ||
            'Детальний опис відсутній...',
          url: post.link ?? '', // 👈 А ссылку сохраняем отдельно (убедись, что добавил url в NewsItem DTO!)
          source: 'CRYPTOPANIC' as const,
          sentiment: 'NEUTRAL' as const,
          publishedAt: publishedDate,
        };
      });

      this.cachedExternalNews = formattedNews;
      this.logger.log('RSS новости успішно завантажені! (Українською)');
    } catch (error) {
      this.logger.error('Ошибка RSS парсера:', error);
    }
  }
}
