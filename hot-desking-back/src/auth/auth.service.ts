import { config, Hasher } from '../common';
import { PrismaService } from '../prisma';
import { UserStatus } from '../users/dto';
import { mapUserRoleFromDb, mapUserStatusFromDb } from '../users/mappers';
import { AccessDTO, LoginDataDTO, loginDTO } from './dto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserJWT } from './models';
import { ProfileService } from '../users';

const ERROR_MESSAGE = 'Wrongh email or password';

@Injectable()
export class AuthService {
  private readonly jwt = new UserJWT(
    config.jwt.secret,
    config.jwt.expirationSeconds,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly profile: ProfileService,
  ) {}

  public async login(data: loginDTO): Promise<AccessDTO> {
    const user = await this.retrieveForLogin(data.email);
    this.checkLoginPermission(user);

    const match = await Hasher.verify(user.hash, data.password);
    if (!match) {
      throw new UnauthorizedException(ERROR_MESSAGE);
    }

    const token = await this.jwt.sign(user.id, user.role);
    const profile = await this.profile.getSelf(user.id);
    return {
      ...profile,
      token,
    };
  }

  private async retrieveForLogin(email: string): Promise<LoginDataDTO> {
    const data = await this.prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
      },
      select: {
        id: true,
        hash: true,
        role: true,
        status: true,
      },
    });
    if (!data || !data.hash) {
      throw new UnauthorizedException(ERROR_MESSAGE);
    }

    return {
      id: data.id,
      hash: data.hash,
      role: mapUserRoleFromDb(data.role),
      status: mapUserStatusFromDb(data.status),
    };
  }

  private checkLoginPermission(user: LoginDataDTO): void {
    if (user.status !== UserStatus.Active) {
      throw new UnauthorizedException(ERROR_MESSAGE);
    }
  }
}
