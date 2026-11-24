import { getCurrentUser } from '@/server/auth/session';
import { readFileFor } from '@/server/services/files';

/** Serves an uploaded file if the visitor may see it (product photos are public; everything else is private). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const file = Number.isInteger(id) && id > 0 ? await readFileFor(await getCurrentUser(), id) : null;
  if (!file) return Response.json({ error: 'File not found' }, { status: 404 });
  const { meta, bytes } = file;
  const filename = meta.name.replace(/["\\\r\n]/g, '').replace(/[^\x20-\x7e]/g, '_');
  return new Response(Buffer.from(bytes), {
    headers: {
      'Content-Type': meta.mime,
      'Content-Length': String(bytes.length),
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': meta.kind === 'product' ? 'public, max-age=86400' : 'private, no-store',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
