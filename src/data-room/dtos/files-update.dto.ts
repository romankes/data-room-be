import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilesUpdateDto {
  @ApiPropertyOptional({ description: 'New file name', example: 'report.pdf' })
  @IsString()
  @IsOptional()
  name?: string;
}
