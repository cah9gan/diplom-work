import { Controller, Get, Param, Query } from '@nestjs/common';
import { MarketService } from './market.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Market')
@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('symbols')
  @ApiOperation({ summary: 'Получить список отслеживаемых криптовалют' })
  getSupportedSymbols(): string[] {
    return this.marketService.getSupportedSymbols();
  }

  // ДОБАВЛЯЕМ ЭНДПОИНТ ИСТОРИИ
  @Get('history/:symbol')
  @ApiOperation({ summary: 'Получить исторические данные для графика' })
  async getHistory(
    @Param('symbol') symbol: string,
    @Query('interval') interval?: string,
  ) {
    return this.marketService.getHistory(symbol, interval || '1d');
  }
}
