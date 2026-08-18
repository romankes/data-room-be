import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilesUpdateDto {
  @ApiPropertyOptional({ description: 'New file name', example: 'report.pdf' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  @Matches(/\.pdf$/i, { message: 'name must end with .pdf' })
  name?: string;
}
