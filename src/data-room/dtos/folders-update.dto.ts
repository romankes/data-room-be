import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FoldersUpdateDto {
  @ApiPropertyOptional({ description: 'New folder name', example: 'Archive' })
  @IsString()
  @IsOptional()
  name?: string;
}
