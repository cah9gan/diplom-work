import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { CoinGeckoService } from './coingecko.service';

@Module({
  imports: [
    PrismaModule,
    HttpModule, // Обязательно для работы this.httpService.get()
  ],
  controllers: [NewsController],
  providers: [NewsService, CoinGeckoService],
  exports: [NewsService], // На случай, если новости понадобятся другим модулям
})
export class NewsModule {}
