import {
  BadRequestException,
  NotFoundException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateOrderDTO } from './dto';
import { PriceService } from '../market/price.service';
import { Decimal } from 'decimal.js';

type TransactionDb = Omit<PrismaService, '$transaction'>;

interface OrderContext {
  userId: string;
  symbol: string;
  amount: Decimal;
  cost: Decimal;
  price: number;
  stopLoss?: number;
  takeProfit?: number;
}

@Injectable()
export class TradeService {
  private readonly logger = new Logger(TradeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly priceService: PriceService,
  ) {}

  public async executeOrder(userId: string, dto: CreateOrderDTO) {
    const marketPrice = this.priceService.getLatestPrice(dto.symbol);
    const amount = new Decimal(dto.amount);
    const cost = amount.mul(marketPrice);

    const ctx: OrderContext = {
      userId,
      symbol: dto.symbol,
      amount,
      cost,
      price: marketPrice,
      stopLoss: dto.stopLoss,
      takeProfit: dto.takeProfit,
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

  // ---------------------------------------------------------
  // АВТОМАТИЧНЕ ЗАКРИТТЯ ПО SL / TP (Викликається фоновим таском)
  // ---------------------------------------------------------
  public async checkAndTriggerPriceOrders() {
    const positions = await this.prisma.tradePosition.findMany({
      where: {
        status: 'OPEN',
        OR: [{ sl: { not: null } }, { tp: { not: null } }],
      },
    });

    for (const pos of positions) {
      let currentPrice: number;

      try {
        // Обертаємо запит ціни у try/catch
        currentPrice = this.priceService.getLatestPrice(pos.symbol);
      } catch {
        // Якщо ціни ще немає (сервер тільки-но запустився),
        // просто пропускаємо цю монету і перевіримо її через секунду
        continue;
      }

      let shouldClose = false;
      let triggerReason = '';

      const stopLoss = pos.sl ? Number(pos.sl) : null;
      const takeProfit = pos.tp ? Number(pos.tp) : null;

      if (stopLoss && currentPrice <= stopLoss) {
        shouldClose = true;
        triggerReason = 'STOP_LOSS';
      }

      if (takeProfit && currentPrice >= takeProfit) {
        shouldClose = true;
        triggerReason = 'TAKE_PROFIT';
      }

      if (shouldClose) {
        this.logger.log(
          `🚨 Спрацював ордер [${triggerReason}] для користувача ${pos.userId} по монеті ${pos.symbol} (Ціна: ${currentPrice})`,
        );

        const mockDto: CreateOrderDTO = {
          symbol: pos.symbol,
          amount: Number(pos.amount),
          type: 'SELL',
        };

        try {
          await this.executeOrder(pos.userId, mockDto);
        } catch (err) {
          this.logger.error(
            `Не вдалося автоматично закрити ордер для ${pos.userId}:`,
            err,
          );
        }
      }
    }
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
          adminId: adminId,
          type: 'DEPOSIT',
          amount,
          price: 1,
        },
      });
      return wallet;
    });
  }

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

    // 👇 Записуємо stopLoss та takeProfit у відповідні поля БД: sl та tp
    await db.tradePosition.create({
      data: {
        userId: ctx.userId,
        symbol: ctx.symbol,
        amount: ctx.amount.toString(),
        entryPrice: ctx.price,
        status: 'OPEN',
        sl: ctx.stopLoss ?? null,
        tp: ctx.takeProfit ?? null,
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

  public async getPortfolio(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        positions: { where: { status: 'OPEN' } },
      },
    });

    const walletBalance = Number(user?.wallet?.balance || 0);
    let totalUnrealizedPnL = 0;
    let totalPositionValue = 0;

    const activePositions =
      user?.positions.map((pos) => {
        const currentPrice = this.priceService.getLatestPrice(pos.symbol);
        const entryValue = Number(pos.amount) * Number(pos.entryPrice);
        const currentValue = Number(pos.amount) * currentPrice;
        const profit = currentValue - entryValue;
        const profitPercentage =
          entryValue > 0 ? (profit / entryValue) * 100 : 0;

        totalUnrealizedPnL += profit;
        totalPositionValue += currentValue;

        return {
          id: pos.id,
          symbol: pos.symbol,
          amount: Number(pos.amount),
          entryPrice: Number(pos.entryPrice),
          currentPrice,
          profit,
          profitPercentage,
          stopLoss: pos.sl ? Number(pos.sl) : null, // 👈 Віддаємо на фронт як stopLoss
          takeProfit: pos.tp ? Number(pos.tp) : null, // 👈 Віддаємо на фронт як takeProfit
        };
      }) || [];

    const totalEquity = walletBalance + totalPositionValue;

    return {
      walletBalance,
      totalEquity,
      totalUnrealizedPnL,
      activePositions,
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
