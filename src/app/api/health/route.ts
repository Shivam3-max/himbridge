import { sql } from 'drizzle-orm';
import { db } from '@/server/db/client';

export const dynamic = 'force-dynamic';

/** Liveness/readiness check for the hosting platform and uptime monitors. */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('[health] database check failed', err);
    return Response.json({ status: 'error', database: 'unreachable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
