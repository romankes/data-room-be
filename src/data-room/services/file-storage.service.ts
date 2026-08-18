import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  STORAGE_CONFIG,
  type StorageConfig,
} from '../../config/storage.config';

export interface StoredObjectMetadata {
  contentLength: number;
  contentType?: string;
}

@Injectable()
export class FileStorageService {
  private readonly client: S3Client;
  private readonly config: StorageConfig;

  constructor(configService: ConfigService) {
    this.config = configService.getOrThrow<StorageConfig>(STORAGE_CONFIG);

    const missing = [
      ['R2_ACCOUNT_ID', this.config.accountId],
      ['R2_ACCESS_KEY_ID', this.config.accessKeyId],
      ['R2_SECRET_ACCESS_KEY', this.config.secretAccessKey],
      ['R2_BUCKET', this.config.bucket],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);

    if (missing.length > 0) {
      throw new Error(`Missing storage configuration: ${missing.join(', ')}`);
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.config.accountId}.r2.cloudflarestorage.com`,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
  }

  get maxFileSizeBytes(): number {
    return this.config.maxFileSizeBytes;
  }

  async createUploadUrl(storageKey: string) {
    const expiresIn = this.config.uploadUrlTtlSeconds;
    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: storageKey,
        ContentType: 'application/pdf',
      }),
      { expiresIn },
    );

    return {
      url,
      method: 'PUT' as const,
      headers: { 'Content-Type': 'application/pdf' },
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  }

  async createDownloadUrl(storageKey: string, fileName: string) {
    const expiresIn = this.config.downloadUrlTtlSeconds;
    const encodedFileName = encodeURIComponent(fileName).replace(
      /[!'()*]/g,
      (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    );
    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: storageKey,
        ResponseContentType: 'application/pdf',
        ResponseContentDisposition: `inline; filename*=UTF-8''${encodedFileName}`,
      }),
      { expiresIn },
    );

    return {
      url,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  }

  async getMetadata(storageKey: string): Promise<StoredObjectMetadata | null> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: storageKey,
        }),
      );

      return {
        contentLength: result.ContentLength ?? 0,
        contentType: result.ContentType,
      };
    } catch (error: unknown) {
      if (
        error instanceof S3ServiceException &&
        error.$metadata.httpStatusCode === 404
      ) {
        return null;
      }

      throw error;
    }
  }

  async hasPdfSignature(storageKey: string): Promise<boolean> {
    const result = await this.client.send(
      new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: storageKey,
        Range: 'bytes=0-4',
      }),
    );
    const bytes = await result.Body?.transformToByteArray();

    return (
      bytes !== undefined && Buffer.from(bytes).toString('ascii') === '%PDF-'
    );
  }

  async copy(
    sourceStorageKey: string,
    targetStorageKey: string,
  ): Promise<void> {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.config.bucket,
        CopySource: `${this.config.bucket}/${sourceStorageKey}`,
        Key: targetStorageKey,
        ContentType: 'application/pdf',
        MetadataDirective: 'REPLACE',
      }),
    );
  }

  async delete(storageKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: storageKey,
      }),
    );
  }

  async deleteMany(storageKeys: string[]): Promise<void> {
    const concurrency = 20;

    for (let index = 0; index < storageKeys.length; index += concurrency) {
      await Promise.all(
        storageKeys
          .slice(index, index + concurrency)
          .map((storageKey) => this.delete(storageKey)),
      );
    }
  }
}
