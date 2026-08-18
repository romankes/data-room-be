import type { File, Folder } from '../generated/prisma/client';
import { FileEntity } from '../data-room/entities/file.entity';

export type FileMappable = Pick<
  File,
  'id' | 'name' | 'mimeType' | 'size' | 'createdAt' | 'updatedAt'
> & {
  folder?: Pick<Folder, 'id' | 'name'> | null;
};

export function mapFile(file: FileMappable): FileEntity {
  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    size: file.size,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    ...(file.folder !== undefined
      ? {
          folder: file.folder
            ? { id: file.folder.id, name: file.folder.name }
            : null,
        }
      : {}),
  };
}
