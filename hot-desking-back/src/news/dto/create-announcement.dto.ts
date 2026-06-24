import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnnouncementDTO {
  @ApiProperty({ example: 'Технічні роботи на сервері' })
  @IsString()
  @MaxLength(100)
  title: string;

  @ApiProperty({
    example:
      'Завтра с 02:00 до 03:00 платформа буде недоступна. Заздалегідь дякуємо за розуміння.',
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
