import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FilesCreateDto {
  @ApiPropertyOptional({
    description: 'ID of the folder that will contain the file',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  folderId?: string;

  @ApiProperty({ description: 'File name', example: 'contract.pdf' })
  @IsString()
  name!: string;
}
