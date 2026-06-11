/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

interface BinanceSymbolConfig {
  symbol: string;
  status: string;
  quoteAsset: string;
}

interface BinanceExchangeInfo {
  symbols: BinanceSymbolConfig[];
}

@Injectable()
export class SymbolsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async onModuleInit() {
    const count = await this.prisma.trackedSymbol.count();

    if (count === 0) {
      const defaultSymbols = [
        { symbol: 'btcusdt', name: 'Bitcoin' },
        { symbol: 'ethusdt', name: 'Ethereum' },
        { symbol: 'bnbusdt', name: 'BNB' },
        { symbol: 'solusdt', name: 'Solana' },
        { symbol: 'xrpusdt', name: 'Ripple' },
      ];
      await this.prisma.trackedSymbol.createMany({ data: defaultSymbols });
    }
  }

  async getActiveSymbols(): Promise<string[]> {
    const symbols = await this.prisma.trackedSymbol.findMany({
      where: { isActive: true },
      select: { symbol: true },
    });
    return symbols.map((s) => s.symbol.toLowerCase());
  }

  async checkIsActive(symbol: string): Promise<boolean> {
    const dbSymbol = await this.prisma.trackedSymbol.findUnique({
      where: { symbol: symbol.toLowerCase() },
    });
    return dbSymbol?.isActive || false;
  }

  async addSymbol(symbol: string, name?: string) {
    const normalizedSymbol = symbol.toLowerCase().trim();

    // 👇 Добавили недостающий await, о котором справедливо просил линтер
    return await this.prisma.trackedSymbol.upsert({
      where: { symbol: normalizedSymbol },
      update: { isActive: true, name },
      create: { symbol: normalizedSymbol, name },
    });
  }

  async getAvailableBinanceSymbols(): Promise<string[]> {
    const url = 'https://api.binance.com/api/v3/exchangeInfo';
    const response = await firstValueFrom(
      this.httpService.get<BinanceExchangeInfo>(url),
    );

    return response.data.symbols
      .filter((s) => s.status === 'TRADING' && s.quoteAsset === 'USDT')
      .map((s) => s.symbol.toLowerCase());
  }

  async deactivateSymbol(symbol: string) {
    return await this.prisma.trackedSymbol.update({
      where: { symbol: symbol.toLowerCase() },
      data: { isActive: false },
    });
  }
}
