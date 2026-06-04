import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MarketService } from './market.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccessGuard, SWAGGER_BEARER_NAME } from '../common';

@ApiTags('Market')
@ApiBearerAuth(SWAGGER_BEARER_NAME) // Авторизация для Swagger
@UseGuards(AccessGuard) // 👈 Закрываем ВСЕ эндпоинты в этом контроллере твоим секьюрити-гардом
@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('symbols')
  @ApiOperation({ summary: 'Получить список отслеживаемых криптовалют' })
  getSupportedSymbols(): string[] {
    return this.marketService.getSupportedSymbols();
  }

  @Get('intervals')
  @ApiOperation({ summary: 'Получить список доступных таймфреймов' })
  getSupportedIntervals(): string[] {
    return this.marketService.getSupportedIntervals();
  }

  @Get('history/:symbol')
  @ApiOperation({ summary: 'Получить исторические данные для графика' })
  async getHistory(
    @Param('symbol') symbol: string,
    @Query('interval') interval?: string,
  ) {
    return this.marketService.getHistory(symbol, interval || '1d');
  }
}
