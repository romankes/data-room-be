import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FileFolderEntity {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Contracts' })
  name!: string;
}

export class FileEntity {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'contract.pdf' })
  name!: string;

  @ApiProperty({ example: 'application/pdf' })
  mimeType!: string;

  @ApiProperty({ type: Number, nullable: true, example: 245760 })
  size!: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiPropertyOptional({
    type: () => FileFolderEntity,
    nullable: true,
    description: 'Parent folder when it was loaded for this response',
  })
  folder?: FileFolderEntity | null;
}

export class FileUploadEntity {
  @ApiProperty({ format: 'uri' })
  url!: string;

  @ApiProperty({ enum: ['PUT'], example: 'PUT' })
  method!: 'PUT';

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { 'Content-Type': 'application/pdf' },
  })
  headers!: Record<string, string>;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: Date;
}

export class FileUploadInitializationEntity {
  @ApiProperty({ format: 'uuid' })
  uploadId!: string;

  @ApiProperty({ type: () => FileUploadEntity })
  upload!: FileUploadEntity;

  @ApiProperty({ example: 52428800 })
  maxFileSizeBytes!: number;
}

export class FileDownloadEntity {
  @ApiProperty({ format: 'uri' })
  url!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: Date;
}
