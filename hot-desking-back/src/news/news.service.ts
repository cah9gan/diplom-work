import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateAnnouncementDTO, NewsItem } from './dto';
import { CoinGeckoService } from './coingecko.service';

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly coinGeckoService: CoinGeckoService,
  ) {}

  public async getCombinedNews(): Promise<NewsItem[]> {
    const announcements = await this.getAdminAnnouncements();

    const externalNews = this.coinGeckoService.getCachedNews();

    return [...announcements, ...externalNews].sort(
      (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
    );
  }

  public async createAnnouncement(dto: CreateAnnouncementDTO) {
    return await this.prisma.announcement.create({
      data: {
        title: dto.title,
        content: dto.content,
        sentiment: dto.sentiment || 'ANNOUNCEMENT',
      },
    });
  }

  public async deleteAnnouncement(id: string) {
    return await this.prisma.announcement.delete({
      where: { id },
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
}
