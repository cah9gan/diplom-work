import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessGuard, IdParamDTO, Roles, SWAGGER_BEARER_NAME } from '../common';
import { NewsService } from './news.service';
import { UserRole } from '../users/dto';
import { CreateAnnouncementDTO } from './dto';

@ApiTags('News')
@Controller('news') // 👈 Прибрали @UseGuards звідси, тепер контролер відкритий
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  // ---------------------------------------------------------
  // ПУБЛІЧНИЙ МЕТОД (Для ВСІХ користувачів, навіть без логіна)
  // ---------------------------------------------------------

  @Get()
  @HttpCode(HttpStatus.OK)
  async getNewsFeed() {
    return this.newsService.getCombinedNews();
  }

  // ---------------------------------------------------------
  // АДМИН ПАНЕЛЬ (Только для администраторов)
  // ---------------------------------------------------------

  @ApiBearerAuth(SWAGGER_BEARER_NAME)
  @UseGuards(AccessGuard) // 👈 Захищаємо тільки цей метод
  @Roles(UserRole.Admin)
  @Post('announcements')
  @HttpCode(HttpStatus.CREATED)
  async createAnnouncement(@Body() dto: CreateAnnouncementDTO) {
    return this.newsService.createAnnouncement(dto);
  }

  @ApiBearerAuth(SWAGGER_BEARER_NAME)
  @UseGuards(AccessGuard) // 👈 І захищаємо цей метод
  @Roles(UserRole.Admin)
  @Delete('announcements/:id')
  @HttpCode(HttpStatus.OK)
  async deleteAnnouncement(@Param() { id }: IdParamDTO) {
    return this.newsService.deleteAnnouncement(id);
  }
}
