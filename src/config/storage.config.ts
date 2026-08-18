import { registerAs } from '@nestjs/config';

export const STORAGE_CONFIG = 'storage';

export interface StorageConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  maxFileSizeBytes: number;
  uploadUrlTtlSeconds: number;
  downloadUrlTtlSeconds: number;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const StorageConfigFactory = registerAs(
  STORAGE_CONFIG,
  (): StorageConfig => ({
    accountId: process.env.R2_ACCOUNT_ID ?? '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    bucket: process.env.R2_BUCKET ?? '',
    maxFileSizeBytes: positiveInteger(
      process.env.MAX_PDF_SIZE_BYTES,
      50 * 1024 * 1024,
    ),
    uploadUrlTtlSeconds: positiveInteger(
      process.env.R2_UPLOAD_URL_TTL_SECONDS,
      15 * 60,
    ),
    downloadUrlTtlSeconds: positiveInteger(
      process.env.R2_DOWNLOAD_URL_TTL_SECONDS,
      15 * 60,
    ),
  }),
);
