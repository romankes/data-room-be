import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { mapUser } from '../../mappers/user.mapper';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async getById(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      return null;
    }

    return mapUser(user);
  }

  async getCredentialsByEmail(email: string) {
    return this.prismaService.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });
  }

  async createWithPassword(email: string, passwordHash: string) {
    return this.prismaService.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          email,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
        },
      });

      await transaction.shareRecipient.updateMany({
        where: { email: user.email, userId: null },
        data: { userId: user.id },
      });

      return mapUser(user);
    });
  }

  async findOrCreate(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    return this.prismaService.$transaction(async (transaction) => {
      const user = await transaction.user.upsert({
        where: { email: normalizedEmail },
        create: {
          email: normalizedEmail,
        },
        update: {},
        select: {
          id: true,
          email: true,
        },
      });

      await transaction.shareRecipient.updateMany({
        where: { email: user.email, userId: null },
        data: { userId: user.id },
      });

      return mapUser(user);
    });
  }
}
