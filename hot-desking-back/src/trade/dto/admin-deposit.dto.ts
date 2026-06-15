import { IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminDepositDTO {
  @ApiProperty({ description: 'Сума поповнення (USDT)', example: 1000 })
  @IsNumber()
  @IsPositive()
  amount: number;
}
