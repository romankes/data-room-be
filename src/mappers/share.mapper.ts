import type { Share } from '../generated/prisma/client';
import { ShareEntity } from '../data-room/entities/share.entity';
import { mapFile, type FileMappable } from './file.mapper';
import { mapFolder, type FolderMappable } from './folder.mapper';
import {
  mapShareRecipient,
  type ShareRecipientMappable,
} from './share-recipient.mapper';
import { mapUser, type UserMappable } from './user.mapper';

export type ShareMappable = Pick<
  Share,
  | 'id'
  | 'mode'
  | 'targetType'
  | 'folderId'
  | 'fileId'
  | 'createdAt'
  | 'expiresAt'
> &
  Partial<Pick<Share, 'revokedAt'>> & {
    owner?: UserMappable;
    folder?: FolderMappable | null;
    file?: FileMappable | null;
    recipients?: ShareRecipientMappable[];
  };

export interface MapShareOptions {
  includeOwner?: boolean;
}

export function mapShare(
  share: ShareMappable,
  options: MapShareOptions = {},
): ShareEntity {
  return {
    id: share.id,
    mode: share.mode,
    targetType: share.targetType,
    createdAt: share.createdAt,
    ...('revokedAt' in share ? { revokedAt: share.revokedAt } : {}),
    expiresAt: share.expiresAt,
    ...(options.includeOwner && share.owner
      ? { owner: mapUser(share.owner) }
      : {}),
    ...(share.folder !== undefined
      ? { folder: share.folder ? mapFolder(share.folder) : null }
      : {}),
    ...(share.file !== undefined
      ? { file: share.file ? mapFile(share.file) : null }
      : {}),
    ...(share.recipients !== undefined
      ? {
          recipients: share.recipients.map((recipient) =>
            mapShareRecipient(recipient),
          ),
        }
      : {}),
  };
}
