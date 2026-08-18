import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class SharesContentDto {
  @ApiPropertyOptional({
    description:
      'Folder to browse within an ALL or FOLDER share; omit to open the share root',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  folderId?: string;
}
