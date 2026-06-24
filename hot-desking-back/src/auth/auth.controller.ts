import { Body, Controller, Post } from '@nestjs/common';
import { AccessDTO, loginDTO, VerifyCodeDTO } from './dto';
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
  @ApiCreatedResponse({
    description: 'Код відправлений на пошту (requires2FA)',
  })
  @ApiBadRequestResponse({ description: 'Wrong input' })
  @ApiUnauthorizedResponse({ description: 'Wrong email or password' })
  login(
    @Body() data: loginDTO,
  ): Promise<
    | { message: string; requires2FA: true }
    | (AccessDTO & { requires2FA: false })
  > {
    return this.authService.login(data);
  }

  @Post('verify')
  @ApiCreatedResponse({ type: AccessDTO, description: 'Login successful' })
  @ApiBadRequestResponse({
    description: 'Час роботи коду закінчився або неправильний запит',
  })
  @ApiUnauthorizedResponse({ description: 'Невірний код' })
  verifyCode(@Body() verifyDto: VerifyCodeDTO): Promise<AccessDTO> {
    return this.authService.verifyCode(verifyDto);
  }
}
