import { Body, Controller, Post } from '@nestjs/common';
import { AccessDTO, loginDTO, VerifyCodeDTO } from './dto'; // 👈 Добавили импорт VerifyCodeDTO
import { AuthService } from './auth.service';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiCreatedResponse({ description: 'Код отправлен на почту (requires2FA)' })
  @ApiBadRequestResponse({ description: 'Wrong input' })
  @ApiUnauthorizedResponse({ description: 'Wrong email or password' })
  // 👇 Точно такая же сигнатура, как мы сделали в auth.service.ts
  login(
    @Body() data: loginDTO,
  ): Promise<
    | { message: string; requires2FA: true }
    | (AccessDTO & { requires2FA: false })
  > {
    return this.authService.login(data);
  }

  // 👇 НОВЫЙ ЭНДПОИНТ ДЛЯ ПРОВЕРКИ КОДА 👇
  @Post('verify')
  @ApiCreatedResponse({ type: AccessDTO, description: 'Login successful' }) // 👈 Теперь токен возвращается отсюда
  @ApiBadRequestResponse({
    description: 'Срок действия кода истек или неверный запрос',
  })
  @ApiUnauthorizedResponse({ description: 'Неверный код' })
  verifyCode(@Body() verifyDto: VerifyCodeDTO): Promise<AccessDTO> {
    // 👈 Исправили регистр DTO и убрали async
    return this.authService.verifyCode(verifyDto); // 👈 Исправили название метода
  }
}
