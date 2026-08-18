import { registerAs } from '@nestjs/config';

export const SERVER_CONFIG = 'server';

export interface ServerConfig {
  host: string;
  port: number;
  corsOrigins: string[];
}

export const ServerConfigFactory = registerAs(
  SERVER_CONFIG,
  (): ServerConfig => ({
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT || '3002', 10),
    corsOrigins: process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000'],
  }),
);
