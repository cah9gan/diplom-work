import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { TradeService } from './trade.service';
import { CreateOrderDTO } from './dto/create-order.dto';
import { AdminDepositDTO } from './dto/admin-deposit.dto';

import {
  AccessGuard,
  Roles,
  SWAGGER_BEARER_NAME,
  User,
  IdParamDTO,
} from '../common';
import { type JWTUser } from '../auth/models';
import { UserRole } from './dto';

@ApiBearerAuth(SWAGGER_BEARER_NAME)
@UseGuards(AccessGuard)
@Controller('trade')
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  // ---------------------------------------------------------
  // ТОРГОВЛЯ (Доступна всім авторизованим користувачам)
  // ---------------------------------------------------------

  @Post('order')
  @HttpCode(HttpStatus.OK)
  async executeOrder(@User() user: JWTUser, @Body() dto: CreateOrderDTO) {
    return this.tradeService.executeOrder(user.userId, dto);
  }

  @Get('portfolio')
  async getPortfolio(@User() user: JWTUser) {
    return this.tradeService.getPortfolio(user.userId);
  }

  @Get('history')
  async getHistory(@User() user: JWTUser) {
    return this.tradeService.getTransactionHistory(user.userId);
  }

  // ---------------------------------------------------------
  // АДМІН ПАНЕЛЬ (Доступна тільки адміністраторам)
  // ---------------------------------------------------------

  @Roles(UserRole.Admin)
  @Post('deposit/:id')
  @HttpCode(HttpStatus.OK)
  async adminDeposit(
    @User() admin: JWTUser,
    @Param() { id }: IdParamDTO,
    @Body() dto: AdminDepositDTO,
  ) {
    return this.tradeService.adminDeposit(admin.userId, id, dto.amount);
  }

  @Roles(UserRole.Admin)
  @Get('history/:id')
  @HttpCode(HttpStatus.OK)
  async getUserHistoryByAdmin(@Param() { id }: IdParamDTO) {
    return this.tradeService.getTransactionHistory(id);
  }
}
