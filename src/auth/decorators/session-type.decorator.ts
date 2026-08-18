import { SetMetadata } from '@nestjs/common';

export const REQUIRED_SESSION_TYPE_KEY = 'requiredSessionType';

export const RequireUser = () => SetMetadata(REQUIRED_SESSION_TYPE_KEY, 'user');

export const RequireGuest = () =>
  SetMetadata(REQUIRED_SESSION_TYPE_KEY, 'guest');
