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

// Импортируем твои общие декораторы и гварды
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
@UseGuards(AccessGuard) // Защищаем весь контроллер
@Controller('trade')
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  // ---------------------------------------------------------
  // ТОРГОВЛЯ (Доступно всем авторизованным пользователям)
  // ---------------------------------------------------------

  @Post('order')
  @HttpCode(HttpStatus.OK)
  async executeOrder(@User() user: JWTUser, @Body() dto: CreateOrderDTO) {
    return this.tradeService.executeOrder(user.userId, dto);
  }

  @Get('portfolio')
  async getPortfolio(@User() user: JWTUser) {
    return this.tradeService.getUserPortfolio(user.userId);
  }

  @Get('history')
  async getHistory(@User() user: JWTUser) {
    return this.tradeService.getTransactionHistory(user.userId);
  }

  // ---------------------------------------------------------
  // АДМИН ПАНЕЛЬ (Доступно только администраторам)
  // ---------------------------------------------------------

  @Roles(UserRole.Admin) // 👈 Ограничиваем доступ только для админов
  @Post('deposit/:id')
  @HttpCode(HttpStatus.OK)
  async adminDeposit(
    @User() admin: JWTUser,
    @Param() { id }: IdParamDTO, // id пользователя, которому зачисляем деньги
    @Body() dto: AdminDepositDTO,
  ) {
    return this.tradeService.adminDeposit(admin.userId, id, dto.amount);
  }
}
