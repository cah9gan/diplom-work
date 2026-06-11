import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class AddSymbolDTO {
  @ApiProperty({
    example: 'adausdt',
    description: 'Торговая пара на Binance (без пробелов)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  symbol: string;

  @ApiPropertyOptional({
    example: 'Cardano',
    description: 'Понятное название монеты',
  })
  @IsString()
  @IsOptional()
  name?: string;
}
