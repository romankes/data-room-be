import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilesCreateDto } from '../dtos/files-create.dto';
import { FilesUpdateDto } from '../dtos/files-update.dto';
import { FilesListDto } from '../dtos/files-list.dto';

@Injectable()
export class FilesService {
  constructor(private readonly prismaService: PrismaService) {}

  async getById(id: string, userId: string) {
    const data = await this.prismaService.file.findUniqueOrThrow({
      where: {
        id,
        userId,
      },
      include: {
        folder: true,
      },
      omit: {
        userId: true,
      },
    });

    return data;
  }

  async create(dto: FilesCreateDto, userId: string) {
    const result = await this.prismaService.file.findFirst({
      where: {
        folderId: dto.folderId,
        name: dto.name,
        userId,
      },
    });

    if (result) {
      throw new BadRequestException('Folder already exists');
    }

    const data = await this.prismaService.file.create({
      data: {
        name: dto.name,
        folderId: dto.folderId,
        userId,
      },
      include: {
        folder: true,
      },
      omit: {
        userId: true,
        folderId: true,
      },
    });

    return data;
  }

  async delete(id: string, userId: string) {
    await this.prismaService.file.delete({
      where: { id, userId },
    });
  }

  async update(id: string, dto: FilesUpdateDto, userId: string) {
    const folder = await this.getById(id, userId);

    const result = await this.prismaService.file.findFirst({
      where: {
        folderId: folder.folderId,
        name: dto.name,
        userId,
      },
    });

    if (result) {
      throw new BadRequestException('Folder already exists');
    }

    const data = await this.prismaService.file.update({
      where: {
        id,
        userId,
      },
      data: {
        name: dto.name,
      },
      include: {
        folder: true,
      },
      omit: {
        userId: true,
        folderId: true,
      },
    });

    return data;
  }

  async getList(dto: FilesListDto, userId: string) {
    const data = await this.prismaService.file.findMany({
      where: {
        folderId: dto.folderId,
        userId,
      },
      include: {
        folder: true,
      },
      omit: {
        userId: true,
        folderId: true,
      },
    });

    return data;
  }
}
