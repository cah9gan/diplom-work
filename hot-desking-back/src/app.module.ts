import { Module } from '@nestjs/common';
import { UsersModule } from './users';
import { AuthModule } from './auth';
import { PrismaModule } from './prisma';
import { MarketModule } from './market/market.module';
import { AiModule } from './ai';
import { TradeModule } from './trade/trade.module';

@Module({
  imports: [
    AiModule,
    AuthModule,
    UsersModule,
    PrismaModule,
    MarketModule,
    TradeModule,
  ],
})
export class AppModule {}
