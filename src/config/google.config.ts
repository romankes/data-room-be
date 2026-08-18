import { registerAs } from '@nestjs/config';

export const GOOGLE_CONFIG = 'google' as const;

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  successRedirectUrl: string;
}

export const GoogleConfigFactory = registerAs(
  GOOGLE_CONFIG,
  (): GoogleConfig => ({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL!,
    successRedirectUrl: process.env.GOOGLE_SUCCESS_REDIRECT_URL!,
  }),
);
