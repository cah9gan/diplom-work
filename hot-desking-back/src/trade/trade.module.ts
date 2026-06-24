import { Module, OnModuleInit } from '@nestjs/common';
import { TradeController } from './trade.controller';
import { TradeService } from './trade.service';
import { MarketModule } from '../market';
@Module({
  imports: [MarketModule],
  controllers: [TradeController],
  providers: [TradeService],
  exports: [TradeService],
})
export class TradeModule implements OnModuleInit {
  constructor(private readonly tradeService: TradeService) {}

  onModuleInit() {
    setInterval(() => {
      void this.tradeService.checkAndTriggerPriceOrders();
    }, 1000);
  }
}
