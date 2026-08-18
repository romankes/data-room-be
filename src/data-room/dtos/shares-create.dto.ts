import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShareMode, ShareTargetType } from '../../generated/prisma/enums';

export class SharesCreateDto {
  @ApiProperty({ enum: ShareMode, example: ShareMode.AUTHORIZED })
  @IsEnum(ShareMode)
  mode!: ShareMode;

  @ApiProperty({ enum: ShareTargetType, example: ShareTargetType.FOLDER })
  @IsEnum(ShareTargetType)
  targetType!: ShareTargetType;

  @ApiPropertyOptional({
    description: 'Required when targetType is FOLDER',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  folderId?: string;

  @ApiPropertyOptional({
    description: 'Required when targetType is FILE',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  fileId?: string;

  @ApiPropertyOptional({
    description:
      'Recipient emails; unregistered recipients gain access after registering with the same email',
    type: [String],
    example: ['viewer@example.com'],
    maxItems: 100,
  })
  @Transform(({ value }: { value: unknown }) => {
    if (!Array.isArray(value)) {
      return value;
    }

    const emails = value as unknown[];
    return emails.map((email) =>
      typeof email === 'string' ? email.trim().toLowerCase() : email,
    );
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsEmail({}, { each: true })
  @IsOptional()
  recipientEmails?: string[];

  @ApiPropertyOptional({
    description: 'Optional ISO 8601 expiry timestamp in the future',
    example: '2026-09-01T12:00:00.000Z',
  })
  @IsDateString({ strict: true })
  @IsOptional()
  expiresAt?: string;
}
