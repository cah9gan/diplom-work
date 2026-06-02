import { Module } from '@nestjs/common';
import { UsersModule } from './users';
import { AuthModule } from './auth';
import { PrismaModule } from './prisma';
import { MarketModule } from './market/market.module';

@Module({
  imports: [AuthModule, UsersModule, PrismaModule, MarketModule],
})
export class AppModule {}
