import { randomUUID } from 'crypto';
import { PrismaClient } from '../../generated/prisma/internal/class';
import { config, Hasher } from '../../src/common';
import { UserRole, UserStatus } from '../../generated/prisma/enums';

export const seedUser = async (prisma: PrismaClient): Promise<void> => {
  const { email, password, firstName, lastName } = config.seedUser;

  console.log('Seeding user');

  if (!(email && password && firstName && lastName)) {
    console.log('Seed user is not configured. Skipping.');
    return;
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });

  if (user) {
    console.log(`User ${email} already exists. Skipping.`);
    return;
  }

  const id = randomUUID();
  const hash = await Hasher.hash(password);
  await prisma.user.create({
    data: {
      id,
      createdBy: id,
      email,
      firstName,
      lastName,
      hash,
      role: UserRole.admin,
      status: UserStatus.active,
    },
  });
  console.log(`User ${email} seeded.`);
};
