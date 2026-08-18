import { registerAs } from '@nestjs/config';

export const JWT_CONFIG = 'jwt';

export interface JwtConfig {
  secret: string;
}

export const JwtConfigFactory = registerAs(JWT_CONFIG, (): JwtConfig => ({
  secret: process.env.JWT_PRIVATE_KEY || '',
}));
