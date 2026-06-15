import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreateAnnouncementDTO, NewsItem } from './dto';

import * as translate from '@vitalets/google-translate-api';

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  public async getCombinedNews(): Promise<NewsItem[]> {
    const [announcements, externalNews] = await Promise.all([
      this.getAdminAnnouncements(),
      this.getCoinGeckoNews(),
    ]);

    return [...announcements, ...externalNews].sort(
      (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
    );
  }

  // Методы админа остались прежними
  public async createAnnouncement(dto: CreateAnnouncementDTO) {
    return await this.prisma.announcement.create({
      data: {
        title: dto.title,
        content: dto.content,
        sentiment: dto.sentiment || 'ANNOUNCEMENT',
      },
    });
  }

  private async getAdminAnnouncements(): Promise<NewsItem[]> {
    const records = await this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    return records.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content || undefined,
      source: 'SYSTEM',
      sentiment: r.sentiment as NewsItem['sentiment'],
      publishedAt: r.createdAt,
    }));
  }

  private async getCoinGeckoNews(): Promise<NewsItem[]> {
    try {
      interface CGNewsItem {
        title: string;
        url: string;
        updated_at: number;
      }
      interface CGResponse {
        data: CGNewsItem[];
      }

      const url = `https://api.coingecko.com/api/v3/news`;
      const response = await firstValueFrom(
        this.httpService.get<CGResponse>(url),
      );

      const news = response.data.data.slice(0, 10);

      // Используем Promise.all для перевода
      const translatedNews = await Promise.all(
        news.map(async (post, index) => {
          // Безопасное получение функции перевода в зависимости от типа экспорта
          const translateFn =
            (translate as any).translate ||
            (translate as any).default ||
            translate;

          try {
            const res = await (translateFn as any)(post.title, { to: 'uk' });

            return {
              id: `cg-${post.updated_at}-${index}`,
              title: res.text as string,
              content: post.url,
              source: 'CRYPTOPANIC' as const,
              sentiment: 'NEUTRAL' as const,
              publishedAt: new Date(post.updated_at * 1000), // Конвертируем секунды в миллисекунды
            };
          } catch {
            // Если перевод не удался, возвращаем оригинал
            return {
              id: `cg-${post.updated_at}-${index}`,
              title: post.title,
              content: post.url,
              source: 'CRYPTOPANIC' as const,
              sentiment: 'NEUTRAL' as const,
              publishedAt: new Date(post.updated_at * 1000),
            };
          }
        }),
      );

      return translatedNews;
    } catch (error) {
      this.logger.error('Ошибка CoinGecko:', error);
      return [];
    }
  }
}
