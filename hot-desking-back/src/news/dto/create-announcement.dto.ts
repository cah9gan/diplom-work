import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnnouncementDTO {
  @ApiProperty({ example: 'Технические работы на сервере' })
  @IsString()
  @MaxLength(100)
  title: string;

  @ApiProperty({
    example: 'Завтра с 02:00 до 03:00 платформа будет недоступна.',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ example: 'ANNOUNCEMENT' })
  @IsString()
  @IsOptional()
  @IsIn(['ANNOUNCEMENT', 'BULLISH', 'BEARISH', 'NEUTRAL'])
  sentiment?: string;
}
