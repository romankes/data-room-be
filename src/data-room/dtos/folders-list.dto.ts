import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FoldersListDto {
  @ApiPropertyOptional({
    description: 'Filter folders by their parent folder',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  folderId?: string;
}
