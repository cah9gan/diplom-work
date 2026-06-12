import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import {
  ChangeProfileDTO,
  ResetPasswordDTO,
  SetPasswordDTO,
  UpdateTwoFactorDTO,
  ViewProfileDTO,
} from './dto';
import { AccessGuard, SWAGGER_BEARER_NAME, User } from '../common';
import { type JWTUser } from '../auth/models';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @UseGuards(AccessGuard)
  @ApiBearerAuth(SWAGGER_BEARER_NAME)
  getProfile(@User() user: JWTUser): Promise<ViewProfileDTO> {
    return this.profileService.getSelf(user.userId);
  }

  @Post('reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(@Body() { email }: ResetPasswordDTO): Promise<void> {
    return this.profileService.resetPassword(email);
  }

  @Post('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  setPassword(@Body() data: SetPasswordDTO): Promise<void> {
    return this.profileService.setPassword(data);
  }

  @Patch()
  @UseGuards(AccessGuard)
  @ApiBearerAuth(SWAGGER_BEARER_NAME)
  @HttpCode(HttpStatus.NO_CONTENT)
  changeProfile(
    @User() user: JWTUser,
    @Body() data: ChangeProfileDTO,
  ): Promise<void> {
    return this.profileService.changeProfile(user.userId, data);
  }

  @Patch('2fa')
  @UseGuards(AccessGuard)
  @ApiBearerAuth(SWAGGER_BEARER_NAME)
  @HttpCode(HttpStatus.NO_CONTENT)
  updateTwoFactor(
    @User() user: JWTUser,
    @Body() data: UpdateTwoFactorDTO,
  ): Promise<void> {
    return this.profileService.changeTwoFactorStatus(user.userId, data.status);
  }
}
