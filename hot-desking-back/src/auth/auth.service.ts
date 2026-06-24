import { config, Hasher } from '../common';
import { PrismaService } from '../prisma';
import { TwoFactorStatus, UserStatus } from '../users/dto';
import { mapUserRoleFromDb, mapUserStatusFromDb } from '../users/mappers';
import { AccessDTO, LoginDataDTO, loginDTO, VerifyCodeDTO } from './dto';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserJWT } from './models';
import { ProfileService } from '../users';
import { LoginCodeEmailService } from '../email';

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
    private readonly loginEmailService: LoginCodeEmailService,
  ) {}

  // Шаг 1: Перевірка параля та відправка коду
  public async login(
    data: loginDTO,
  ): Promise<
    | { message: string; requires2FA: true }
    | (AccessDTO & { requires2FA: false })
  > {
    const user = await this.retrieveForLogin(data.email);
    this.checkLoginPermission(user);

    const match = await Hasher.verify(user.hash, data.password);
    if (!match) {
      throw new UnauthorizedException(ERROR_MESSAGE);
    }

    // Підтягуємо профіль, щоб використовувати ім'я користувача у красивому HTML-листі
    const profile = await this.profile.getSelf(user.id);

    if (user.twoFactorStatus === TwoFactorStatus.Inactive) {
      // 2FA вимкнена -> віддаємо JWT одразу (старе поведінка)
      const token = await this.jwt.sign(user.id, user.role);
      return {
        ...profile,
        token,
        requires2FA: false, // Фронтенд зрозуміє, що код не потрібен
      };
    }

    // Генеруємо 6 цифр
    const rawCode = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedCode = await Hasher.hash(rawCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 хвилин

    // Зберігаємо або оновлюємо код у базі даних
    await this.prisma.loginEmail.upsert({
      where: { userId: user.id },
      update: { code: hashedCode, expiresAt, attempts: 0 },
      create: { userId: user.id, code: hashedCode, expiresAt },
    });

    // Відправляємо лист з кодом підтвердження на пошту користувача
    await this.loginEmailService.send({
      email: data.email,
      name: profile.firstName,
      code: rawCode,
    });

    // Відповідаємо фронтенду, що токена поки немає, потрібно переключитися на вікно введення коду
    return {
      message: 'Код підтвердження відправлено на пошту',
      requires2FA: true,
    };
  }

  // Шаг 2: Перевірка кода і финальна видача JWT
  public async verifyCode(data: VerifyCodeDTO): Promise<AccessDTO> {
    const user = await this.retrieveForLogin(data.email);
    this.checkLoginPermission(user);

    // Дістаємо запис про запрошений код
    const loginRecord = await this.prisma.loginEmail.findUnique({
      where: { userId: user.id },
    });

    if (!loginRecord) {
      throw new BadRequestException('Запит на авторизацію не знайдено');
    }

    // Перевіряємо термін дії (10 хвилин)
    if (new Date() > loginRecord.expiresAt) {
      await this.prisma.loginEmail.delete({ where: { userId: user.id } });
      throw new BadRequestException(
        'Термін дії коду минув. Спробуйте увійти ще раз.',
      );
    }

    const isCodeValid = await Hasher.verify(loginRecord.code, data.code);
    if (!isCodeValid) {
      throw new UnauthorizedException('Невірний код підтвердження');
    }

    await this.prisma.loginEmail.delete({ where: { userId: user.id } });

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
        twoFactorStatus: true,
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
      twoFactorStatus: data.twoFactorStatus as TwoFactorStatus,
    };
  }

  private checkLoginPermission(user: LoginDataDTO): void {
    if (user.status !== UserStatus.Active) {
      throw new UnauthorizedException(ERROR_MESSAGE);
    }
  }
}
