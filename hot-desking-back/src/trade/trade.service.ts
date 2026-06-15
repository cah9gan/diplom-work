import {
  BadRequestException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateOrderDTO } from './dto';
import { PriceService } from '../market/price.service';
import { Decimal } from 'decimal.js';

// Вытаскиваем тип из твоего рабочего PrismaService, исключая сам метод $transaction.
// Это решает проблему "any" для линтера раз и навсегда.
type TransactionDb = Omit<PrismaService, '$transaction'>;

interface OrderContext {
  userId: string;
  symbol: string;
  amount: Decimal;
  cost: Decimal;
  price: number;
}

@Injectable()
export class TradeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly priceService: PriceService,
  ) {}

  // ---------------------------------------------------------
  // 1. ПУБЛИЧНЫЙ ФАСАД (Только маршрутизация логики)
  // ---------------------------------------------------------
  public async executeOrder(userId: string, dto: CreateOrderDTO) {
    const marketPrice = this.priceService.getLatestPrice(dto.symbol);
    const amount = new Decimal(dto.amount);
    const cost = amount.mul(marketPrice);

    // Пакуем всё в один аккуратный объект
    const ctx: OrderContext = {
      userId,
      symbol: dto.symbol,
      amount,
      cost,
      price: marketPrice,
    };

    return this.prisma.$transaction(async (tx) => {
      const db = tx as unknown as TransactionDb;

      const wallet = await db.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      if (dto.type === 'BUY') {
        return this.processBuy(db, ctx, wallet.balance);
      }

      if (dto.type === 'SELL') {
        return this.processSell(db, ctx);
      }

      throw new BadRequestException('Invalid order type');
    });
  }

  public async adminDeposit(
    adminId: string,
    targetUserId: string,
    amount: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const db = tx as unknown as TransactionDb;

      const wallet = await db.wallet.upsert({
        where: { userId: targetUserId },
        update: { balance: { increment: amount } },
        create: { userId: targetUserId, balance: amount },
      });

      await db.transaction.create({
        data: {
          userId: targetUserId,
          adminId: adminId, // 👈 Записываем админа в базу
          type: 'DEPOSIT',
          amount,
          price: 1,
        },
      });

      return wallet;
    });
  }

  // ---------------------------------------------------------
  // 2. ПРИВАТНЫЕ МЕТОДЫ (Изолированная бизнес-логика)
  // ---------------------------------------------------------

  private async processBuy(
    db: TransactionDb,
    ctx: OrderContext,
    rawBalance: unknown,
  ) {
    const currentBalance = new Decimal(String(rawBalance));

    if (currentBalance.lessThan(ctx.cost)) {
      throw new BadRequestException('Insufficient funds in wallet');
    }

    await db.wallet.update({
      where: { userId: ctx.userId },
      data: { balance: { decrement: ctx.cost.toString() } },
    });

    await db.tradePosition.create({
      data: {
        userId: ctx.userId,
        symbol: ctx.symbol,
        amount: ctx.amount.toString(),
        entryPrice: ctx.price,
        status: 'OPEN',
      },
    });

    const transaction = await db.transaction.create({
      data: {
        userId: ctx.userId,
        type: 'BUY',
        amount: ctx.amount.toString(),
        price: ctx.price,
      },
    });

    return {
      success: true,
      transactionId: transaction.id,
      message: 'Buy order executed',
    };
  }

  private async processSell(db: TransactionDb, ctx: OrderContext) {
    const openPositions = await db.tradePosition.findMany({
      where: { userId: ctx.userId, symbol: ctx.symbol, status: 'OPEN' },
      orderBy: { createdAt: 'asc' },
    });

    const totalAsset = openPositions.reduce((acc, pos) => {
      return acc.add(new Decimal(String(pos.amount)));
    }, new Decimal(0));

    if (totalAsset.lessThan(ctx.amount)) {
      throw new BadRequestException('Insufficient asset balance to sell');
    }

    let remainingToSell = ctx.amount;

    for (const pos of openPositions) {
      if (remainingToSell.equals(0)) break;

      const posAmount = new Decimal(String(pos.amount));

      if (posAmount.lessThanOrEqualTo(remainingToSell)) {
        await db.tradePosition.update({
          where: { id: pos.id },
          data: { status: 'CLOSED', amount: 0 },
        });
        remainingToSell = remainingToSell.sub(posAmount);
      } else {
        await db.tradePosition.update({
          where: { id: pos.id },
          data: { amount: posAmount.sub(remainingToSell).toString() },
        });
        remainingToSell = new Decimal(0);
      }
    }

    await db.wallet.update({
      where: { userId: ctx.userId },
      data: { balance: { increment: ctx.cost.toString() } },
    });

    const transaction = await db.transaction.create({
      data: {
        userId: ctx.userId,
        type: 'SELL',
        amount: ctx.amount.toString(),
        price: ctx.price,
      },
    });

    return {
      success: true,
      transactionId: transaction.id,
      message: 'Sell order executed',
    };
  }

  // ---------------------------------------------------------
  // 3. МЕТОДЫ ПРОСМОТРА (Чтение данных)
  // ---------------------------------------------------------

  public async getUserPortfolio(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    const openPositions = await this.prisma.tradePosition.findMany({
      where: { userId, status: 'OPEN' },
    });

    let totalUnrealizedPnL = 0;

    const positionsWithPnL = openPositions.map((pos) => {
      let currentPrice: number;
      try {
        currentPrice = this.priceService.getLatestPrice(pos.symbol);
      } catch {
        currentPrice = Number(pos.entryPrice);
      }

      const entry = Number(pos.entryPrice);
      const amount = Number(pos.amount);
      const profit = (currentPrice - entry) * amount;
      const profitPercentage = ((currentPrice - entry) / entry) * 100;

      totalUnrealizedPnL += profit;

      return {
        id: pos.id,
        symbol: pos.symbol,
        amount,
        entryPrice: entry,
        currentPrice,
        profit,
        profitPercentage,
        createdAt: pos.createdAt,
      };
    });

    const balance = wallet ? Number(wallet.balance) : 0;

    return {
      walletBalance: balance,
      totalEquity: balance + totalUnrealizedPnL,
      totalUnrealizedPnL,
      activePositions: positionsWithPnL,
    };
  }

  public async getTransactionHistory(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        amount: true,
        price: true,
        createdAt: true,
      },
    });
  }
}
