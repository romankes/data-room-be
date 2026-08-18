import type { User } from '../generated/prisma/client';
import { UserEntity } from '../auth/entities/user.entity';

export type UserMappable = Pick<User, 'id' | 'email'>;

export function mapUser(user: UserMappable): UserEntity {
  return {
    id: user.id,
    email: user.email,
  };
}
