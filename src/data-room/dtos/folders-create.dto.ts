import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FoldersCreateDto {
  @ApiPropertyOptional({
    description: 'ID of the parent folder',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  folderId?: string;

  @ApiProperty({ description: 'Folder name', example: 'Documents' })
  @IsString()
  name!: string;
}
