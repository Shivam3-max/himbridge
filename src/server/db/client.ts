import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env, isProduction } from '@/config/env';
import * as schema from './schema';

// Re-use one connection pool across hot reloads in development.
const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };

const client = globalForDb.pg ?? postgres(env.DATABASE_URL, { max: isProduction ? 10 : 5 });
if (!isProduction) globalForDb.pg = client;

export const db = drizzle(client, { schema });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export { schema };
