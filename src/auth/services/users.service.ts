import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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

    return user;
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
    return this.prismaService.user.create({
      data: {
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
      },
    });
  }

  async findOrCreate(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prismaService.user.upsert({
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

    return user;
  }
}
