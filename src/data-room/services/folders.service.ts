import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FoldersListDto } from '../dtos/folders-list.dto';
import { FoldersCreateDto } from '../dtos/folders-create.dto';
import { FoldersUpdateDto } from '../dtos/folders-update.dto';

@Injectable()
export class FoldersService {
  constructor(private readonly prismaService: PrismaService) {}

  async getById(id: string, userId: string) {
    const data = await this.prismaService.folder.findUniqueOrThrow({
      where: {
        id,
        userId,
      },
      include: {
        files: true,
        folders: true,
        folder: true,
      },
      omit: {
        userId: true,
      },
    });

    return data;
  }

  async create(dto: FoldersCreateDto, userId: string) {
    const result = await this.prismaService.folder.findFirst({
      where: {
        folderId: dto.folderId,
        name: dto.name,
        userId,
      },
    });

    if (result) {
      throw new BadRequestException('Folder already exists');
    }

    const data = await this.prismaService.folder.create({
      data: {
        name: dto.name,
        folderId: dto.folderId,
        userId,
      },
      include: {
        files: true,
        folders: true,
      },
      omit: {
        userId: true,
        folderId: true,
      },
    });

    return data;
  }

  async delete(id: string, userId: string) {
    await this.prismaService.folder.delete({
      where: { id, userId },
    });
  }

  async update(id: string, dto: FoldersUpdateDto, userId: string) {
    const folder = await this.getById(id, userId);

    const result = await this.prismaService.folder.findFirst({
      where: {
        folderId: folder.folderId,
        name: dto.name,
        userId,
      },
    });

    if (result) {
      throw new BadRequestException('Folder already exists');
    }

    const data = await this.prismaService.folder.update({
      where: {
        id,
        userId,
      },
      data: {
        name: dto.name,
      },
      include: {
        files: true,
        folders: true,
      },
      omit: {
        userId: true,
        folderId: true,
      },
    });

    return data;
  }

  async getList(dto: FoldersListDto, userId: string) {
    const data = await this.prismaService.folder.findMany({
      where: {
        folderId: dto.folderId,
        userId,
      },
      include: {
        files: true,
        folders: true,
      },
      omit: {
        userId: true,
        folderId: true,
      },
    });

    return data;
  }
}
