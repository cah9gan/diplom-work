import { UserRole } from './user-role';
import { UserStatus } from './user-status.dto';

export class ViewUserDTO {
  id: string;

  role: UserRole;

  firstName: string;

  lastName: string;

  email: string;

  status: UserStatus;

  createdAt: Date;

  createdBy: string;
}
