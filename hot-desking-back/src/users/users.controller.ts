import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { BanUserDTO, CreateUserDTO, UserRole, ViewUserDTO } from './dto';
import { IdParamDTO, Roles, SWAGGER_BEARER_NAME } from '../common';
import { AccessGuard } from '../common';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('users')
export class UsersControler {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() data: CreateUserDTO): Promise<ViewUserDTO> {
    return this.usersService.create(data);
  }

  @ApiBearerAuth(SWAGGER_BEARER_NAME)
  @UseGuards(AccessGuard)
  @Roles(UserRole.Admin)
  @Get()
  get(): Promise<ViewUserDTO[]> {
    return this.usersService.get();
  }

  @ApiBearerAuth(SWAGGER_BEARER_NAME)
  @UseGuards(AccessGuard)
  @Roles(UserRole.Admin)
  @Get(':id')
  getOne(@Param() { id }: IdParamDTO): Promise<ViewUserDTO> {
    return this.usersService.getOne(id);
  }

  @ApiBearerAuth(SWAGGER_BEARER_NAME)
  @UseGuards(AccessGuard)
  @Roles(UserRole.Admin)
  @Put(':id')
  update(
    @Param() { id }: IdParamDTO,
    @Body() data: CreateUserDTO,
  ): Promise<ViewUserDTO> {
    return this.usersService.update(id, data);
  }

  @ApiBearerAuth(SWAGGER_BEARER_NAME)
  @UseGuards(AccessGuard)
  @Roles(UserRole.Admin)
  @Post(':id/ban')
  ban(
    @Param() { id }: IdParamDTO,
    @Body() data: BanUserDTO,
  ): Promise<ViewUserDTO> {
    return this.usersService.ban(id, data);
  }
}
