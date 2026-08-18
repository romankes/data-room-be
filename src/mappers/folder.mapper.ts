import type { Folder } from '../generated/prisma/client';
import { FolderEntity } from '../data-room/entities/folder.entity';
import { mapFile, type FileMappable } from './file.mapper';

export type FolderMappable = Pick<Folder, 'id' | 'name'> &
  Partial<Pick<Folder, 'folderId'>> & {
    folder?: Pick<Folder, 'id' | 'name'> | null;
    folders?: FolderMappable[];
    files?: FileMappable[];
  };

export function mapFolder(folder: FolderMappable): FolderEntity {
  return {
    id: folder.id,
    name: folder.name,
    ...('folderId' in folder ? { folderId: folder.folderId } : {}),
    ...(folder.folder !== undefined
      ? {
          folder: folder.folder
            ? { id: folder.folder.id, name: folder.folder.name }
            : null,
        }
      : {}),
    ...(folder.folders !== undefined
      ? { folders: folder.folders.map((child) => mapFolder(child)) }
      : {}),
    ...(folder.files !== undefined
      ? { files: folder.files.map((file) => mapFile(file)) }
      : {}),
  };
}
