import type { ShareRecipient } from '../generated/prisma/client';
import { ShareRecipientEntity } from '../data-room/entities/share-recipient.entity';
import { mapUser, type UserMappable } from './user.mapper';

export type ShareRecipientMappable = Pick<
  ShareRecipient,
  'email' | 'createdAt' | 'revokedAt'
> & {
  user?: UserMappable | null;
};

export function mapShareRecipient(
  recipient: ShareRecipientMappable,
): ShareRecipientEntity {
  return {
    email: recipient.email,
    createdAt: recipient.createdAt,
    revokedAt: recipient.revokedAt,
    ...(recipient.user !== undefined
      ? { user: recipient.user ? mapUser(recipient.user) : null }
      : {}),
  };
}
