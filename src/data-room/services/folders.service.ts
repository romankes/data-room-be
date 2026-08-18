import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FoldersListDto } from '../dtos/folders-list.dto';
import { FoldersCreateDto } from '../dtos/folders-create.dto';
import { FoldersUpdateDto } from '../dtos/folders-update.dto';
import { SearchDto } from '../dtos/search.dto';
import { FileStorageService } from './file-storage.service';
import { mapFolder } from '../../mappers/folder.mapper';

@Injectable()
export class FoldersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async getById(id: string, userId: string) {
    const data = await this.prismaService.folder.findUniqueOrThrow({
      where: {
        id,
        userId,
      },
      include: {
        files: {
          omit: { userId: true, folderId: true, storageKey: true },
        },
        folders: true,
        folder: true,
      },
      omit: {
        userId: true,
      },
    });

    return mapFolder(data);
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
        files: {
          omit: { userId: true, folderId: true, storageKey: true },
        },
        folders: true,
      },
      omit: {
        userId: true,
        folderId: true,
      },
    });

    return mapFolder(data);
  }

  async delete(id: string, userId: string) {
    const storageKeys = await this.prismaService.$transaction(
      async (transaction) => {
        await transaction.folder.findUniqueOrThrow({
          where: { id, userId },
          select: { id: true },
        });

        const folderIds = [id];
        let currentLevel = [id];

        while (currentLevel.length > 0) {
          const children = await transaction.folder.findMany({
            where: { userId, folderId: { in: currentLevel } },
            select: { id: true },
          });
          currentLevel = children.map((folder) => folder.id);
          folderIds.push(...currentLevel);
        }

        const files = await transaction.file.findMany({
          where: { userId, folderId: { in: folderIds } },
          select: { storageKey: true },
        });

        await transaction.folder.delete({
          where: { id, userId },
        });

        return files.flatMap((file) =>
          file.storageKey ? [file.storageKey] : [],
        );
      },
      {
        isolationLevel: 'Serializable',
      },
    );

    await this.fileStorageService.deleteMany(storageKeys);
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
        files: {
          omit: { userId: true, folderId: true, storageKey: true },
        },
        folders: true,
      },
      omit: {
        userId: true,
        folderId: true,
      },
    });

    return mapFolder(data);
  }

  async getList(dto: FoldersListDto, userId: string) {
    const data = await this.prismaService.folder.findMany({
      where: {
        folderId: dto.folderId ?? null,
        userId,
      },
      include: {
        files: {
          omit: { userId: true, folderId: true, storageKey: true },
        },
        folders: true,
      },
      omit: {
        userId: true,
        folderId: true,
      },
    });

    return data.map((folder) => mapFolder(folder));
  }

  async search(dto: SearchDto, userId: string) {
    const data = await this.prismaService.folder.findMany({
      where: {
        userId,
        name: {
          contains: dto.query,
          mode: 'insensitive',
        },
      },
      include: {
        folder: {
          omit: { userId: true },
        },
      },
      omit: {
        userId: true,
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });

    return data.map((folder) => mapFolder(folder));
  }
}
