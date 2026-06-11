import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MarketService } from './market.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccessGuard, Roles, SWAGGER_BEARER_NAME } from '../common';
import { AddSymbolDTO } from './dto';
import { SymbolsService } from './symbols.service';
import { UserRole } from '../users/dto';

@ApiTags('Market')
@ApiBearerAuth(SWAGGER_BEARER_NAME)
@UseGuards(AccessGuard)
@Controller('market')
export class MarketController {
  constructor(
    private readonly marketService: MarketService,
    private readonly symbolsService: SymbolsService, // 👈 Инжектим сервис для подсказок
  ) {}

  @Get('symbols')
  @ApiOperation({ summary: 'Получить список отслеживаемых криптовалют' })
  async getSupportedSymbols(): Promise<string[]> {
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

  @Get('predict/:symbol')
  @ApiOperation({ summary: 'Получить мгновенный ИИ-прогноз для монеты' })
  async getPrediction(
    @Param('symbol') symbol: string,
    @Query('interval') interval?: string,
  ) {
    // interval по умолчанию '1d', если фронт не передал другой
    return this.marketService.getInstantPrediction(symbol, interval || '1d');
  }

  // 👇 НОВЫЕ МЕТОДЫ ДЛЯ АДМИН-ПАНЕЛИ 👇

  @Roles(UserRole.Admin) // Убедись, что тут правильный регистр роли из твоего Enum (admin или Admin)
  @Post('symbols')
  @ApiOperation({ summary: 'Добавить новую криптовалюту для отслеживания' })
  async addSymbol(@Body() data: AddSymbolDTO) {
    return this.marketService.addTrackedSymbol(data.symbol, data.name);
  }

  @Roles(UserRole.Admin)
  @Get('binance-symbols')
  @ApiOperation({ summary: 'Получить подсказки монет с Binance' })
  async getBinanceSymbols(): Promise<string[]> {
    return this.symbolsService.getAvailableBinanceSymbols();
  }

  @Roles(UserRole.Admin)
  @Delete('symbols/:symbol')
  @ApiOperation({ summary: 'Удалить криптовалюту из отслеживаемых' })
  async removeSymbol(@Param('symbol') symbol: string) {
    await this.marketService.removeTrackedSymbol(symbol);
    return { success: true };
  }
}
