import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilesCreateDto } from '../dtos/files-create.dto';
import { FilesUpdateDto } from '../dtos/files-update.dto';
import { FilesListDto } from '../dtos/files-list.dto';
import { SearchDto } from '../dtos/search.dto';
import { FileStorageService } from './file-storage.service';
import { mapFile } from '../../mappers/file.mapper';
import { FilesMoveDto } from '../dtos/files-move.dto';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileStorageService: FileStorageService,
  ) {}

  private async getOwnedFile(id: string, userId: string) {
    return this.prismaService.file.findUniqueOrThrow({
      where: { id, userId },
    });
  }

  private getTemporaryStorageKey(userId: string, uploadId: string): string {
    return `uploads/${userId}/${uploadId}.pdf`;
  }

  private getStorageKey(userId: string, uploadId: string): string {
    return `files/${userId}/${uploadId}.pdf`;
  }

  private async getAvailableName(
    requestedName: string,
    folderId: string | undefined,
    userId: string,
  ): Promise<string> {
    const extension = requestedName.slice(-4);
    const baseName = requestedName.slice(0, -extension.length);
    const duplicatePrefix = `${baseName} (`;
    const files = await this.prismaService.file.findMany({
      where: {
        userId,
        folderId: folderId ?? null,
        OR: [
          { name: requestedName },
          {
            name: {
              startsWith: duplicatePrefix,
              endsWith: extension,
            },
          },
        ],
      },
      select: { name: true },
    });
    const usedNames = new Set(files.map((file) => file.name));

    if (!usedNames.has(requestedName)) {
      return requestedName;
    }

    let duplicateNumber = 1;
    let availableName = `${baseName} (${duplicateNumber})${extension}`;

    while (usedNames.has(availableName)) {
      duplicateNumber += 1;
      availableName = `${baseName} (${duplicateNumber})${extension}`;
    }

    return availableName;
  }

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
        storageKey: true,
      },
    });

    return mapFile(data);
  }

  async createUpload(userId: string) {
    const uploadId = randomUUID();
    const upload = await this.fileStorageService.createUploadUrl(
      this.getTemporaryStorageKey(userId, uploadId),
    );

    return {
      uploadId,
      upload,
      maxFileSizeBytes: this.fileStorageService.maxFileSizeBytes,
    };
  }

  async create(dto: FilesCreateDto, userId: string) {
    if (dto.size > this.fileStorageService.maxFileSizeBytes) {
      throw new BadRequestException(
        `PDF must not exceed ${this.fileStorageService.maxFileSizeBytes} bytes`,
      );
    }

    const temporaryStorageKey = this.getTemporaryStorageKey(
      userId,
      dto.uploadId as string,
    );
    const storageKey = this.getStorageKey(userId, dto.uploadId as string);
    const usedUpload = await this.prismaService.file.findUnique({
      where: { storageKey },
      select: { id: true },
    });
    if (usedUpload) {
      throw new BadRequestException('PDF upload has already been used');
    }

    const metadata =
      await this.fileStorageService.getMetadata(temporaryStorageKey);
    if (!metadata) {
      throw new BadRequestException('PDF has not been uploaded');
    }

    if (
      metadata.contentType !== 'application/pdf' ||
      metadata.contentLength !== dto.size ||
      metadata.contentLength > this.fileStorageService.maxFileSizeBytes
    ) {
      await this.fileStorageService.delete(temporaryStorageKey);
      throw new BadRequestException('Uploaded PDF metadata is invalid');
    }

    if (!(await this.fileStorageService.hasPdfSignature(temporaryStorageKey))) {
      await this.fileStorageService.delete(temporaryStorageKey);
      throw new BadRequestException('Uploaded object is not a valid PDF');
    }

    if (dto.folderId) {
      const folder = await this.prismaService.folder.findUnique({
        where: { id: dto.folderId, userId },
        select: { id: true },
      });
      if (!folder) {
        throw new BadRequestException('Folder does not exist');
      }
    }

    const name = await this.getAvailableName(dto.name, dto.folderId, userId);

    await this.fileStorageService.copy(temporaryStorageKey, storageKey);

    const data = await (async () => {
      try {
        return await this.prismaService.file.create({
          data: {
            name,
            folderId: dto.folderId,
            userId,
            size: dto.size as number,
            storageKey,
          },
          include: {
            folder: true,
          },
          omit: {
            userId: true,
            folderId: true,
            storageKey: true,
          },
        });
      } catch (error: unknown) {
        try {
          const claimedUpload = await this.prismaService.file.findUnique({
            where: { storageKey },
            select: { id: true },
          });

          if (!claimedUpload) {
            await this.fileStorageService.delete(storageKey);
          }
        } catch (cleanupError: unknown) {
          this.logger.error(
            `Could not clean up finalized upload ${dto.uploadId} after a database failure`,
            cleanupError,
          );
        }

        throw error;
      }
    })();

    try {
      await this.fileStorageService.delete(temporaryStorageKey);
    } catch (error: unknown) {
      this.logger.warn(
        `Temporary upload ${dto.uploadId} will be removed by the R2 lifecycle rule`,
        error,
      );
    }

    return mapFile(data);
  }

  async delete(id: string, userId: string) {
    const file = await this.getOwnedFile(id, userId);
    if (file.storageKey) {
      await this.fileStorageService.delete(file.storageKey as string);
    }
    await this.prismaService.file.delete({
      where: { id, userId },
    });
  }

  async update(id: string, dto: FilesUpdateDto, userId: string) {
    const file = await this.getOwnedFile(id, userId);

    const result = await this.prismaService.file.findFirst({
      where: {
        id: { not: id },
        folderId: file.folderId,
        name: dto.name,
        userId,
      },
    });

    if (result) {
      throw new BadRequestException('File already exists');
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
        storageKey: true,
      },
    });

    return mapFile(data);
  }

  async move(id: string, dto: FilesMoveDto, userId: string) {
    const file = await this.getOwnedFile(id, userId);

    if (file.folderId === dto.folderId) {
      return this.getById(id, userId);
    }

    if (dto.folderId) {
      const folder = await this.prismaService.folder.findUnique({
        where: { id: dto.folderId, userId },
        select: { id: true },
      });

      if (!folder) {
        throw new BadRequestException('Destination folder does not exist');
      }
    }

    const conflictingFile = await this.prismaService.file.findFirst({
      where: {
        id: { not: id },
        folderId: dto.folderId,
        name: file.name,
        userId,
      },
      select: { id: true },
    });

    if (conflictingFile) {
      throw new BadRequestException(
        'A file with this name already exists in the destination',
      );
    }

    const data = await this.prismaService.file.update({
      where: { id, userId },
      data: { folderId: dto.folderId },
      include: { folder: true },
      omit: {
        userId: true,
        folderId: true,
        storageKey: true,
      },
    });

    return mapFile(data);
  }

  async getList(dto: FilesListDto, userId: string) {
    const data = await this.prismaService.file.findMany({
      where: {
        folderId: dto.folderId ?? null,
        userId,
      },
      include: {
        folder: true,
      },
      omit: {
        userId: true,
        folderId: true,
        storageKey: true,
      },
    });

    return data.map((file) => mapFile(file));
  }

  async search(dto: SearchDto, userId: string) {
    const data = await this.prismaService.file.findMany({
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
        folderId: true,
        storageKey: true,
      },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });

    return data.map((file) => mapFile(file));
  }

  async getDownloadUrl(id: string, userId: string) {
    const file = await this.getOwnedFile(id, userId);
    if (!file.storageKey) {
      throw new BadRequestException('Legacy file metadata has no PDF upload');
    }

    return this.fileStorageService.createDownloadUrl(
      file.storageKey as string,
      file.name,
    );
  }
}
