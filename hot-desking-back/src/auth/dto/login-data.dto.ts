import { TwoFactorStatus, UserRole, UserStatus } from '../../users/dto';

export type LoginDataDTO = {
  id: string;
  hash: string;
  role: UserRole;
  status: UserStatus;
  twoFactorStatus: TwoFactorStatus;
};
