import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileEntity } from './file.entity';

export class FolderReferenceEntity {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Contracts' })
  name!: string;
}

export class FolderEntity {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Contracts' })
  name!: string;

  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true })
  folderId?: string | null;

  @ApiPropertyOptional({
    type: () => FolderReferenceEntity,
    nullable: true,
    description: 'Parent folder when it was loaded for this response',
  })
  folder?: FolderReferenceEntity | null;

  @ApiPropertyOptional({
    type: () => [FolderEntity],
    description: 'Direct child folders when they were loaded',
  })
  folders?: FolderEntity[];

  @ApiPropertyOptional({
    type: () => [FileEntity],
    description: 'Direct child files when they were loaded',
  })
  files?: FileEntity[];
}
