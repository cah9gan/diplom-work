import { TwoFactorStatus } from './two-factor-status.dto';
import { UserRole } from './user-role';

export class ViewProfileDTO {
  id: string;

  role: UserRole;

  firstName: string;

  lastName: string;

  email: string;

  twoFactorStatus: TwoFactorStatus;
}
