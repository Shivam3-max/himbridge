import 'server-only';
import { env } from '@/config/env';
import { localStorage } from './local';
import { s3Storage } from './s3';

/** Where uploaded file bytes live. Pick with STORAGE_DRIVER (local disk or any S3-compatible bucket). */
export interface StorageDriver {
  put(key: string, data: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  delete(key: string): Promise<void>;
}

export const storage: StorageDriver = env.STORAGE_DRIVER === 's3' ? s3Storage() : localStorage(env.UPLOAD_DIR);
