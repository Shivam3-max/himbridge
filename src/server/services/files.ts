import 'server-only';
import { randomBytes } from 'node:crypto';
import { and, asc, count, eq, inArray } from 'drizzle-orm';
import { detectType, MAX_FILE_BYTES, MAX_PRODUCT_PHOTOS, safeFileName, UPLOAD_TYPES, type FileKind } from '@/domain/files';
import type { CurrentUser } from '../auth/session';
import { db } from '../db/client';
import { file, product, rfq, sourcingRequest } from '../db/schema';
import { AppError, notFound } from '../errors';
import { storage } from '../storage';
import { findOrderFor } from './orders';

export type FileMeta = Pick<typeof file.$inferSelect, 'id' | 'kind' | 'label' | 'name' | 'mime' | 'size' | 'createdAt'>;
const metaColumns = {
  id: file.id,
  kind: file.kind,
  label: file.label,
  name: file.name,
  mime: file.mime,
  size: file.size,
  createdAt: file.createdAt,
};

/** May this user attach a file of this kind to this record? */
async function canAttach(viewer: CurrentUser, kind: FileKind, refId: number | null) {
  switch (kind) {
    case 'kyc':
      return viewer.role === 'vendor';
    case 'product':
      return (
        viewer.role === 'vendor' &&
        refId != null &&
        !!(await db.query.product.findFirst({ where: and(eq(product.id, refId), eq(product.vendorId, viewer.id)), columns: { id: true } }))
      );
    case 'qc':
      return (viewer.role === 'vendor' || viewer.role === 'admin') && refId != null && !!(await findOrderFor(viewer, refId));
    case 'shipping':
      return ['logistics', 'admin', 'vendor'].includes(viewer.role) && refId != null && !!(await findOrderFor(viewer, refId));
    case 'rfq':
      return (
        viewer.role === 'buyer' &&
        refId != null &&
        !!(await db.query.rfq.findFirst({ where: and(eq(rfq.id, refId), eq(rfq.buyerId, viewer.id)), columns: { id: true } }))
      );
    case 'sourcing':
      return (
        (viewer.role === 'buyer' || viewer.role === 'admin') &&
        refId != null &&
        !!(await db.query.sourcingRequest.findFirst({
          where:
            viewer.role === 'admin'
              ? eq(sourcingRequest.id, refId)
              : and(eq(sourcingRequest.id, refId), eq(sourcingRequest.buyerId, viewer.id)),
          columns: { id: true },
        }))
      );
  }
}

/** May this visitor (possibly signed out) download this file? */
async function canRead(viewer: CurrentUser | null, f: typeof file.$inferSelect) {
  if (f.kind === 'product') return true; // product photos are public catalogue content
  if (!viewer) return false;
  if (viewer.role === 'admin' || f.ownerId === viewer.id) return true;
  if ((f.kind === 'qc' || f.kind === 'shipping') && f.refId != null) return !!(await findOrderFor(viewer, f.refId));
  if (f.kind === 'rfq' || f.kind === 'sourcing') return viewer.role === 'vendor'; // reference files are shared with quoting vendors
  return false;
}

/** Validates and stores uploaded files. The real type is detected from the bytes, not trusted from the browser. */
export async function uploadFiles(viewer: CurrentUser, target: { kind: FileKind; refId: number | null; label?: string }, files: File[]) {
  if (!files.length) throw new AppError('Choose at least one file');
  if (target.kind !== 'kyc' && !(target.refId && target.refId > 0)) throw new AppError('Missing reference');
  if (!(await canAttach(viewer, target.kind, target.refId))) throw new AppError('You cannot attach files here', 403);

  if (target.kind === 'product') {
    const [existing] = await db
      .select({ n: count() })
      .from(file)
      .where(and(eq(file.kind, 'product'), eq(file.refId, target.refId!)));
    if ((existing?.n ?? 0) + files.length > MAX_PRODUCT_PHOTOS) throw new AppError('A product can have up to 6 photos', 409);
  }

  // Validate everything before storing anything.
  const prepared = await Promise.all(
    files.map(async (f) => {
      if (f.size > MAX_FILE_BYTES) throw new AppError(`${f.name}: each file must be under 5 MB`, 413);
      const bytes = new Uint8Array(await f.arrayBuffer());
      const mime = detectType(bytes);
      if (!mime) throw new AppError('Only JPG, PNG, WEBP images or PDF documents are accepted', 415);
      if (target.kind === 'product' && mime === 'application/pdf') throw new AppError('Product photos must be JPG, PNG or WEBP', 415);
      const ext = UPLOAD_TYPES[mime]!.ext;
      return { bytes, mime, ext, name: safeFileName(f.name, `file${ext}`) };
    }),
  );

  const ids: number[] = [];
  for (const p of prepared) {
    const key = `${target.kind}-${randomBytes(16).toString('hex')}${p.ext}`;
    await storage.put(key, p.bytes, p.mime);
    const [row] = await db
      .insert(file)
      .values({
        ownerId: viewer.id,
        kind: target.kind,
        refId: target.refId,
        label: target.label?.slice(0, 80) ?? '',
        name: p.name,
        mime: p.mime,
        size: p.bytes.length,
        storageKey: key,
      })
      .returning({ id: file.id });
    ids.push(row!.id);
  }
  return ids;
}

export async function listKycFiles(viewer: CurrentUser, ownerId?: string) {
  const who = viewer.role === 'admin' && ownerId ? ownerId : viewer.id;
  return db
    .select(metaColumns)
    .from(file)
    .where(and(eq(file.kind, 'kyc'), eq(file.ownerId, who)))
    .orderBy(asc(file.id));
}

/** KYC files of many vendors at once (admin verification queue). */
export async function listKycFilesByOwner(ownerIds: string[]) {
  if (!ownerIds.length) return new Map<string, FileMeta[]>();
  const rows = await db
    .select({ ...metaColumns, ownerId: file.ownerId })
    .from(file)
    .where(and(eq(file.kind, 'kyc'), inArray(file.ownerId, ownerIds)))
    .orderBy(asc(file.id));
  const map = new Map<string, FileMeta[]>();
  for (const { ownerId, ...f } of rows) map.set(ownerId, [...(map.get(ownerId) ?? []), f]);
  return map;
}

/** Files attached to records (e.g. RFQ reference images, order documents), grouped by record id. */
export async function listFilesFor(kinds: FileKind[], refIds: number[]) {
  if (!refIds.length) return new Map<number, (FileMeta & { ownerCompany?: string })[]>();
  const rows = await db
    .select({ ...metaColumns, refId: file.refId })
    .from(file)
    .where(and(inArray(file.kind, kinds), inArray(file.refId, refIds)))
    .orderBy(asc(file.id));
  const map = new Map<number, FileMeta[]>();
  for (const { refId, ...f } of rows) if (refId != null) map.set(refId, [...(map.get(refId) ?? []), f]);
  return map;
}

export async function deleteFile(viewer: CurrentUser, id: number) {
  const f = await db.query.file.findFirst({ where: eq(file.id, id) });
  if (!f || (f.ownerId !== viewer.id && viewer.role !== 'admin')) throw notFound('File');
  await db.delete(file).where(eq(file.id, f.id));
  await storage.delete(f.storageKey);
}

/** Removes all files attached to a deleted record. */
export async function deleteFilesFor(kind: FileKind, refId: number) {
  const rows = await db
    .delete(file)
    .where(and(eq(file.kind, kind), eq(file.refId, refId)))
    .returning({ key: file.storageKey });
  await Promise.all(rows.map((r) => storage.delete(r.key)));
}

/** Loads a file for download if the visitor may see it. */
export async function readFileFor(viewer: CurrentUser | null, id: number) {
  const f = await db.query.file.findFirst({ where: eq(file.id, id) });
  if (!f || !(await canRead(viewer, f))) return null;
  const bytes = await storage.get(f.storageKey);
  return bytes ? { meta: f, bytes } : null;
}
