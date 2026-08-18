import { registerAs } from '@nestjs/config';

export const JWT_CONFIG = 'jwt';

export interface JwtConfig {
  secret: string;
}

export const JwtConfigFactory = registerAs(JWT_CONFIG, (): JwtConfig => ({
  // JWT_PRIVATE_KEY is kept as a fallback for existing local environments.
  secret: process.env.JWT_SECRET || process.env.JWT_PRIVATE_KEY || '',
}));
