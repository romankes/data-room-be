import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsUUID, ValidateIf } from 'class-validator';

export class FilesMoveDto {
  @ApiProperty({
    description: 'Destination folder ID, or null to move the file to the root',
    format: 'uuid',
    nullable: true,
    example: 'c05e2953-cbf2-4835-a88a-e1e0f7623190',
  })
  @IsDefined()
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsUUID()
  folderId!: string | null;
}
