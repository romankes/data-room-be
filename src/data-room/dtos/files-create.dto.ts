import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FilesCreateDto {
  @ApiProperty({
    description: 'Upload ID returned by POST /files/upload-url',
    format: 'uuid',
  })
  @IsUUID('4')
  uploadId!: string;

  @ApiPropertyOptional({
    description: 'ID of the folder that will contain the file',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  folderId?: string;

  @ApiProperty({ description: 'File name', example: 'contract.pdf' })
  @IsString()
  @MaxLength(255)
  @Matches(/\.pdf$/i, { message: 'name must end with .pdf' })
  name!: string;

  @ApiProperty({
    description: 'Exact PDF size in bytes',
    example: 1048576,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  size!: number;
}
