import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class AddSymbolDTO {
  @ApiProperty({
    example: 'adausdt',
    description: 'Торгова пара на Binance (без пробілів)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  symbol: string;

  @ApiPropertyOptional({
    example: 'Cardano',
    description: `Понятное название монеты Зрозуміле ім'я монети (необов'язково)`,
  })
  @IsString()
  @IsOptional()
  name?: string;
}
