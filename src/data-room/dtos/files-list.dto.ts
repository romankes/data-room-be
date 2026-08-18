import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilesListDto {
  @ApiPropertyOptional({
    description: 'Filter files by their parent folder',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  folderId?: string;
}
