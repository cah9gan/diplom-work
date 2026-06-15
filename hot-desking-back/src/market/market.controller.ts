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
    private readonly symbolsService: SymbolsService,
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
    return this.marketService.getInstantPrediction(symbol, interval || '1d');
  }

  // 👇 НОВЫЙ ЭНДПОИНТ ДЛЯ БЫСТРОЙ ЗАГРУЗКИ СТАТИСТИКИ 👇

  @Get('stats/24h')
  @ApiOperation({
    summary: 'Получить сводку за 24ч для пар (быстрая загрузка дашборда)',
  })
  async get24hStats(@Query('symbols') symbolsQuery?: string) {
    let symbolsList: string[] = [];

    if (symbolsQuery) {
      // Если фронтенд попросил конкретные пары: ?symbols=BTCUSDT,ETHUSDT
      symbolsList = symbolsQuery.split(',').map((s) => s.trim().toUpperCase());
    } else {
      // Если фронт не указал пары, бэкенд сам берет все активные монеты из БД
      symbolsList = await this.marketService.getSupportedSymbols();
    }

    return this.marketService.getBulk24hStats(symbolsList);
  }

  // ---------------------------------------------------------
  // АДМИН ПАНЕЛЬ
  // ---------------------------------------------------------

  @Roles(UserRole.Admin)
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
