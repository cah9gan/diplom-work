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
  @ApiOperation({ summary: 'Отримати список відстежуваних криптовалют' })
  async getSupportedSymbols(): Promise<string[]> {
    return this.marketService.getSupportedSymbols();
  }

  @Get('intervals')
  @ApiOperation({ summary: 'Отримати список доступних таймфреймів' })
  getSupportedIntervals(): string[] {
    return this.marketService.getSupportedIntervals();
  }

  @Get('history/:symbol')
  @ApiOperation({ summary: 'Отримати історичні дані для графіка' })
  async getHistory(
    @Param('symbol') symbol: string,
    @Query('interval') interval?: string,
  ) {
    return this.marketService.getHistory(symbol, interval || '1d');
  }

  @Get('predict/:symbol')
  @ApiOperation({ summary: 'Отримати миттєвий ШІ-прогноз для монети' })
  async getPrediction(
    @Param('symbol') symbol: string,
    @Query('interval') interval?: string,
  ) {
    return this.marketService.getInstantPrediction(symbol, interval || '1d');
  }

  @Get('predict-ensemble/:symbol')
  @ApiOperation({
    summary: 'Отримати ШІ-прогноз на основі ансамблю (15m, 1h, 1d)',
  })
  async getEnsemblePrediction(@Param('symbol') symbol: string) {
    // Викликаємо наш новий метод із сервісу.
    // Інтервал тут передавати не потрібно, оскільки ансамбль під капотом
    // сам робить запити одразу для трьох таймфреймів.
    return this.marketService.getInstantEnsemblePrediction(symbol);
  }

  @Get('stats/24h')
  @ApiOperation({
    summary: 'Отримати сводку за 24ч для пар (швидка завантаження дашборда)',
  })
  async get24hStats(@Query('symbols') symbolsQuery?: string) {
    let symbolsList: string[] = [];

    if (symbolsQuery) {
      // Якщо фронтенд передав конкретні пари: ?symbols=BTCUSDT,ETHUSDT
      symbolsList = symbolsQuery.split(',').map((s) => s.trim().toUpperCase());
    } else {
      // Якщо фронт не вказав пари, бэкенд сам бере всі активні монети з БД
      symbolsList = await this.marketService.getSupportedSymbols();
    }

    return this.marketService.getBulk24hStats(symbolsList);
  }

  // ---------------------------------------------------------
  // АДМІН ПАНЕЛЬ
  // ---------------------------------------------------------

  @Roles(UserRole.Admin)
  @Post('symbols')
  @ApiOperation({ summary: 'Додати нову криптовалюту для відстеження' })
  async addSymbol(@Body() data: AddSymbolDTO) {
    return this.marketService.addTrackedSymbol(data.symbol, data.name);
  }

  @Roles(UserRole.Admin)
  @Get('binance-symbols')
  @ApiOperation({ summary: 'Отримати підказки монет з Binance' })
  async getBinanceSymbols(): Promise<string[]> {
    return this.symbolsService.getAvailableBinanceSymbols();
  }

  @Roles(UserRole.Admin)
  @Delete('symbols/:symbol')
  @ApiOperation({ summary: 'Видалити криптовалюту з відстежуваних' })
  async removeSymbol(@Param('symbol') symbol: string) {
    await this.marketService.removeTrackedSymbol(symbol);
    return { success: true };
  }
}
