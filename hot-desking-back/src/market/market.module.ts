import { Module } from '@nestjs/common';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { MarketGateway } from './market.gateway';
import { HttpModule } from '@nestjs/axios';
import { SymbolsService } from './symbols.service';
import { PriceService } from './price.service';

@Module({
  imports: [HttpModule],
  controllers: [MarketController],
  providers: [MarketService, MarketGateway, SymbolsService, PriceService],
  exports: [PriceService, MarketService, SymbolsService],
})
export class MarketModule {}
