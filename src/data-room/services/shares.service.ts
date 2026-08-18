import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { ShareMode, ShareTargetType } from '../../generated/prisma/enums';
import { SharesContentDto } from '../dtos/shares-content.dto';
import { SharesCreateDto } from '../dtos/shares-create.dto';
import { FileStorageService } from './file-storage.service';
import { mapFile } from '../../mappers/file.mapper';
import { mapFolder } from '../../mappers/folder.mapper';
import { mapShare } from '../../mappers/share.mapper';

@Injectable()
export class SharesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async create(dto: SharesCreateDto, ownerId: string) {
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (expiresAt && expiresAt <= new Date()) {
      throw new BadRequestException('Share expiry must be in the future');
    }

    await this.validateTarget(dto, ownerId);
    const recipients = await this.resolveRecipients(dto, ownerId);
    const publicToken =
      dto.mode === ShareMode.PUBLIC
        ? randomBytes(32).toString('base64url')
        : null;

    const share = await this.prismaService.share.create({
      data: {
        mode: dto.mode,
        targetType: dto.targetType,
        ownerId,
        folderId: dto.folderId,
        fileId: dto.fileId,
        expiresAt,
        publicTokenHash: publicToken ? this.hashToken(publicToken) : null,
        recipients:
          recipients.length > 0
            ? {
                create: recipients,
              }
            : undefined,
      },
      select: {
        id: true,
        mode: true,
        targetType: true,
        folderId: true,
        fileId: true,
        createdAt: true,
        revokedAt: true,
        expiresAt: true,
        folder: { select: { id: true, name: true } },
        file: {
          select: {
            id: true,
            name: true,
            mimeType: true,
            size: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        recipients: {
          select: {
            email: true,
            createdAt: true,
            revokedAt: true,
            user: { select: { id: true, email: true } },
          },
        },
      },
    });

    return {
      ...mapShare(share),
      ...(publicToken ? { publicToken } : {}),
    };
  }

  async getOwned(ownerId: string) {
    const shares = await this.prismaService.share.findMany({
      where: { ownerId },
      select: {
        id: true,
        mode: true,
        targetType: true,
        folderId: true,
        fileId: true,
        createdAt: true,
        revokedAt: true,
        expiresAt: true,
        folder: { select: { id: true, name: true } },
        file: {
          select: {
            id: true,
            name: true,
            mimeType: true,
            size: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        recipients: {
          select: {
            email: true,
            createdAt: true,
            revokedAt: true,
            user: { select: { id: true, email: true } },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return shares.map((share) => mapShare(share));
  }

  async getReceived(userId: string, userEmail: string) {
    const now = new Date();

    const shares = await this.prismaService.share.findMany({
      where: {
        mode: ShareMode.AUTHORIZED,
        revokedAt: null,
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          {
            recipients: {
              some: {
                revokedAt: null,
                OR: [{ userId }, { email: userEmail }],
              },
            },
          },
        ],
      },
      select: {
        id: true,
        mode: true,
        targetType: true,
        folderId: true,
        fileId: true,
        createdAt: true,
        expiresAt: true,
        owner: { select: { id: true, email: true } },
        folder: { select: { id: true, name: true } },
        file: {
          select: {
            id: true,
            name: true,
            mimeType: true,
            size: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return shares.map((share) => mapShare(share, { includeOwner: true }));
  }

  async getAuthorizedContent(
    shareId: string,
    dto: SharesContentDto,
    userId: string,
    userEmail: string,
  ) {
    const share = await this.getActiveAuthorizedShare(
      shareId,
      userId,
      userEmail,
    );
    return this.getContent(share, dto);
  }

  async getPublicContent(publicToken: string, dto: SharesContentDto) {
    const share = await this.getActivePublicShare(publicToken);
    return this.getContent(share, dto);
  }

  async getAuthorizedDownload(
    shareId: string,
    fileId: string,
    userId: string,
    userEmail: string,
  ) {
    const share = await this.getActiveAuthorizedShare(
      shareId,
      userId,
      userEmail,
    );
    return this.getDownload(share, fileId);
  }

  async getPublicDownload(publicToken: string, fileId: string) {
    const share = await this.getActivePublicShare(publicToken);
    return this.getDownload(share, fileId);
  }

  async replacePublicToken(shareId: string, ownerId: string) {
    const publicToken = randomBytes(32).toString('base64url');
    const now = new Date();
    const result = await this.prismaService.share.updateMany({
      where: {
        id: shareId,
        ownerId,
        mode: ShareMode.PUBLIC,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      data: { publicTokenHash: this.hashToken(publicToken) },
    });

    if (result.count === 0) {
      throw new NotFoundException('Active public share does not exist');
    }

    return { id: shareId, publicToken };
  }

  async revoke(shareId: string, ownerId: string) {
    const revokedAt = new Date();
    const result = await this.prismaService.share.updateMany({
      where: { id: shareId, ownerId, revokedAt: null },
      data: { revokedAt },
    });

    if (result.count === 0) {
      throw new NotFoundException('Active share does not exist');
    }

    return { id: shareId, revokedAt };
  }

  private async validateTarget(dto: SharesCreateDto, ownerId: string) {
    if (dto.targetType === ShareTargetType.ALL) {
      if (dto.folderId || dto.fileId) {
        throw new BadRequestException(
          'ALL shares must not include folderId or fileId',
        );
      }
      return;
    }

    if (dto.targetType === ShareTargetType.FOLDER) {
      if (!dto.folderId || dto.fileId) {
        throw new BadRequestException(
          'FOLDER shares require folderId and must not include fileId',
        );
      }

      const folder = await this.prismaService.folder.findUnique({
        where: { id: dto.folderId, userId: ownerId },
        select: { id: true },
      });
      if (!folder) {
        throw new BadRequestException('Folder does not exist');
      }
      return;
    }

    if (!dto.fileId || dto.folderId) {
      throw new BadRequestException(
        'FILE shares require fileId and must not include folderId',
      );
    }

    const file = await this.prismaService.file.findUnique({
      where: { id: dto.fileId, userId: ownerId },
      select: { id: true },
    });
    if (!file) {
      throw new BadRequestException('File does not exist');
    }
  }

  private async resolveRecipients(
    dto: SharesCreateDto,
    ownerId: string,
  ): Promise<Array<{ email: string; userId: string | null }>> {
    if (dto.mode === ShareMode.PUBLIC) {
      if (dto.recipientEmails) {
        throw new BadRequestException(
          'PUBLIC shares must not include recipientEmails',
        );
      }
      return [];
    }

    if (!dto.recipientEmails?.length) {
      throw new BadRequestException(
        'AUTHORIZED shares require at least one recipient email',
      );
    }

    const users = await this.prismaService.user.findMany({
      where: { email: { in: dto.recipientEmails } },
      select: { id: true, email: true },
    });
    const usersByEmail = new Map(users.map((user) => [user.email, user]));
    if (users.some((user) => user.id === ownerId)) {
      throw new BadRequestException('The share owner cannot be a recipient');
    }

    return dto.recipientEmails.map((email) => ({
      email,
      userId: usersByEmail.get(email)?.id ?? null,
    }));
  }

  private async getActiveAuthorizedShare(
    shareId: string,
    userId: string,
    userEmail: string,
  ) {
    const now = new Date();
    const share = await this.prismaService.share.findFirst({
      where: {
        id: shareId,
        revokedAt: null,
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          {
            OR: [
              { ownerId: userId },
              {
                mode: ShareMode.AUTHORIZED,
                recipients: {
                  some: {
                    revokedAt: null,
                    OR: [{ userId }, { email: userEmail }],
                  },
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        mode: true,
        targetType: true,
        ownerId: true,
        folderId: true,
        fileId: true,
        createdAt: true,
        expiresAt: true,
        owner: { select: { id: true, email: true } },
      },
    });

    if (!share) {
      throw new NotFoundException('Active share does not exist');
    }

    return share;
  }

  private async getActivePublicShare(publicToken: string) {
    const now = new Date();
    const share = await this.prismaService.share.findFirst({
      where: {
        mode: ShareMode.PUBLIC,
        publicTokenHash: this.hashToken(publicToken),
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: {
        id: true,
        mode: true,
        targetType: true,
        ownerId: true,
        folderId: true,
        fileId: true,
        createdAt: true,
        expiresAt: true,
        owner: { select: { id: true, email: true } },
      },
    });

    if (!share) {
      throw new NotFoundException('Active share does not exist');
    }

    return share;
  }

  private async getContent(
    share: Awaited<ReturnType<SharesService['getActivePublicShare']>>,
    dto: SharesContentDto,
  ) {
    const shareDetails = mapShare(share, {
      includeOwner: share.mode === ShareMode.AUTHORIZED,
    });

    if (share.targetType === ShareTargetType.FILE) {
      if (dto.folderId) {
        throw new BadRequestException('FILE shares cannot browse folders');
      }

      const file = await this.prismaService.file.findUnique({
        where: { id: share.fileId as string, userId: share.ownerId },
        select: {
          id: true,
          name: true,
          mimeType: true,
          size: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (!file) {
        throw new NotFoundException('Shared file does not exist');
      }

      return { share: shareDetails, file: mapFile(file) };
    }

    const folderId =
      dto.folderId ??
      (share.targetType === ShareTargetType.FOLDER ? share.folderId : null);
    let folder: { id: string; name: string; folderId: string | null } | null =
      null;

    if (folderId) {
      folder = await this.getFolderInScope(share, folderId);
    }

    const [folders, files] = await Promise.all([
      this.prismaService.folder.findMany({
        where: { userId: share.ownerId, folderId },
        select: { id: true, name: true, folderId: true },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      }),
      this.prismaService.file.findMany({
        where: { userId: share.ownerId, folderId },
        select: {
          id: true,
          name: true,
          mimeType: true,
          size: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      }),
    ]);

    return {
      share: shareDetails,
      folder: folder ? mapFolder(folder) : null,
      folders: folders.map((child) => mapFolder(child)),
      files: files.map((file) => mapFile(file)),
    };
  }

  private async getDownload(
    share: Awaited<ReturnType<SharesService['getActivePublicShare']>>,
    fileId: string,
  ) {
    const file = await this.prismaService.file.findUnique({
      where: { id: fileId, userId: share.ownerId },
      select: {
        id: true,
        name: true,
        folderId: true,
        storageKey: true,
      },
    });
    if (!file || !(await this.isFileInScope(share, file))) {
      throw new NotFoundException('Shared file does not exist');
    }
    if (!file.storageKey) {
      throw new BadRequestException('Shared file has no PDF upload');
    }

    return this.fileStorageService.createDownloadUrl(
      file.storageKey,
      file.name,
    );
  }

  private async getFolderInScope(
    share: Awaited<ReturnType<SharesService['getActivePublicShare']>>,
    folderId: string,
  ) {
    const folder = await this.prismaService.folder.findUnique({
      where: { id: folderId, userId: share.ownerId },
      select: { id: true, name: true, folderId: true },
    });
    if (!folder) {
      throw new NotFoundException('Shared folder does not exist');
    }

    if (
      share.targetType === ShareTargetType.FOLDER &&
      !(await this.isDescendantOrSelf(folder.id, share.folderId as string))
    ) {
      throw new NotFoundException('Shared folder does not exist');
    }

    return folder;
  }

  private async isFileInScope(
    share: Awaited<ReturnType<SharesService['getActivePublicShare']>>,
    file: { id: string; folderId: string | null },
  ): Promise<boolean> {
    if (share.targetType === ShareTargetType.ALL) {
      return true;
    }
    if (share.targetType === ShareTargetType.FILE) {
      return file.id === share.fileId;
    }

    return file.folderId
      ? this.isDescendantOrSelf(file.folderId, share.folderId as string)
      : false;
  }

  private async isDescendantOrSelf(
    folderId: string,
    ancestorId: string,
  ): Promise<boolean> {
    const visited = new Set<string>();
    let currentId: string | null = folderId;

    while (currentId && !visited.has(currentId)) {
      if (currentId === ancestorId) {
        return true;
      }

      visited.add(currentId);
      const folder: { folderId: string | null } | null =
        await this.prismaService.folder.findUnique({
          where: { id: currentId },
          select: { folderId: true },
        });
      currentId = folder?.folderId ?? null;
    }

    return false;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
