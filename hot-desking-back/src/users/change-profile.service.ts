import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { ChangeProfileDTO } from './dto';

@Injectable()
export class ChangeProfileService {
  constructor(private readonly prisma: PrismaService) {}

  public async changeName(
    userId: string,
    data: ChangeProfileDTO,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });
  }
}
