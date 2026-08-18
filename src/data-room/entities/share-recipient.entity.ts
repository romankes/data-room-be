import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserEntity } from '../../auth/entities/user.entity';

export class ShareRecipientEntity {
  @ApiProperty({ example: 'viewer@example.com' })
  email!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  revokedAt!: Date | null;

  @ApiPropertyOptional({ type: () => UserEntity, nullable: true })
  user?: UserEntity | null;
}
