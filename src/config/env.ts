import 'server-only';
import { z } from 'zod';

/**
 * Server environment, validated once at start-up so a misconfigured deployment fails fast
 * with a clear message instead of breaking at the first request.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  APP_URL: z.url().default('http://localhost:3000'),
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  UPLOAD_DIR: z.string().default('./data/uploads'),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().default('auto'),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  SMTP_URL: z.string().optional(),
  MAIL_FROM: z.string().default('Himbridge <no-reply@himbridge.trade>'),
});

function load() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}\nSee .env.example.`);
  }
  const env = parsed.data;
  if (env.STORAGE_DRIVER === 's3' && !env.S3_BUCKET) throw new Error('STORAGE_DRIVER=s3 needs S3_BUCKET (and credentials).');
  return { ...env, APP_URL: env.APP_URL.replace(/\/$/, '') };
}

export const env = load();
export const isProduction = env.NODE_ENV === 'production';
