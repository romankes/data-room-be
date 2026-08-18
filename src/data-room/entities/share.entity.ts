import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserEntity } from '../../auth/entities/user.entity';
import { ShareMode, ShareTargetType } from '../../generated/prisma/enums';
import { FileEntity } from './file.entity';
import { FolderEntity } from './folder.entity';
import { ShareRecipientEntity } from './share-recipient.entity';

export class ShareEntity {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ShareMode })
  mode!: ShareMode;

  @ApiProperty({ enum: ShareTargetType })
  targetType!: ShareTargetType;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  revokedAt?: Date | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  expiresAt!: Date | null;

  @ApiPropertyOptional({ type: () => UserEntity })
  owner?: UserEntity;

  @ApiPropertyOptional({ type: () => FolderEntity, nullable: true })
  folder?: FolderEntity | null;

  @ApiPropertyOptional({ type: () => FileEntity, nullable: true })
  file?: FileEntity | null;

  @ApiPropertyOptional({ type: () => [ShareRecipientEntity] })
  recipients?: ShareRecipientEntity[];
}

export class ShareCreatedEntity extends ShareEntity {
  @ApiPropertyOptional({
    description: 'Returned once when a PUBLIC share is created',
  })
  publicToken?: string;
}

export class SharePublicTokenEntity {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    description:
      'Replacement token for the public share; the previous token is invalidated',
  })
  publicToken!: string;
}

export class ShareContentEntity {
  @ApiProperty({ type: () => ShareEntity })
  share!: ShareEntity;

  @ApiPropertyOptional({
    type: () => FileEntity,
    description: 'Present for a FILE share',
  })
  file?: FileEntity;

  @ApiPropertyOptional({
    type: () => FolderEntity,
    nullable: true,
    description: 'Currently browsed folder for an ALL or FOLDER share',
  })
  folder?: FolderEntity | null;

  @ApiPropertyOptional({
    type: () => [FolderEntity],
    description: 'Direct child folders of the currently browsed folder',
  })
  folders?: FolderEntity[];

  @ApiPropertyOptional({
    type: () => [FileEntity],
    description: 'Direct child files of the currently browsed folder',
  })
  files?: FileEntity[];
}

export class ShareRevocationEntity {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  revokedAt!: Date;
}
