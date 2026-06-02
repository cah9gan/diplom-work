import { UserRole as DB } from '../../../generated/prisma/enums';
import { UserRole as Client } from '../dto';

const toDbMap: Record<Client, DB> = {
  [Client.Admin]: DB.admin,
  [Client.User]: DB.user,
};

const fromDbMap: Record<DB, Client> = {
  [DB.admin]: Client.Admin,
  [DB.user]: Client.User,
};

export const mapUserRoleToDb = (value: Client): DB => toDbMap[value];

export const mapUserRoleFromDb = (value: DB): Client => fromDbMap[value];
