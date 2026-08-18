import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async getById(id: string) {
    const user = await this.prismaService.user.findFirstOrThrow({
      where: { id },
    });

    return user;
  }

  async findOrCreate(email: string) {
    const user = await this.prismaService.user.upsert({
      where: { email },
      create: {
        email,
      },
      update: {},
    });

    return user;
  }
}
