import { IsEnum } from 'class-validator';
import { TwoFactorStatus } from './two-factor-status.dto'; // Путь к твоему файлу

export class UpdateTwoFactorDTO {
  @IsEnum(TwoFactorStatus, {
    message: 'Статус повинен бути або active, або inactive',
  })
  status: TwoFactorStatus;
}
