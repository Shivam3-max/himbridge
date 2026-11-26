import 'server-only';
import { and, asc, count, countDistinct, desc, eq, ilike, inArray, or, sql, sum } from 'drizzle-orm';
import { nichesInSector, type SectorKey } from '@/domain/sectors';
import { NICHES } from '@/domain/niches';
import type { CurrentUser } from '../auth/session';
import { db } from '../db/client';
import { file, order, product, rfq, user, vendorProfile } from '../db/schema';
import { AppError, forbidden, notFound } from '../errors';
import { deleteFilesFor } from './files';
import type { productSchema } from '@/lib/validation';
import type { z } from 'zod';

/** First photo of a product (lowest file id), or null. */
const coverImage = sql<
  number | null
>`(select min(${file.id}) from ${file} where ${file.kind} = 'product' and ${file.refId} = ${product.id})`;

const productColumns = {
  id: product.id,
  niche: product.niche,
  title: product.title,
  description: product.description,
  hsCode: product.hsCode,
  moq: product.moq,
  unit: product.unit,
  priceMin: product.priceMin,
  priceMax: product.priceMax,
  leadDays: product.leadDays,
  material: product.material,
  createdAt: product.createdAt,
  imageId: coverImage,
};

export type ProductListItem = Awaited<ReturnType<typeof listProducts>>[number];

/** Public marketplace: active products of verified vendors. */
export async function listProducts(filters: { q?: string; niche?: string; sector?: SectorKey; limit?: number } = {}) {
  const where = [eq(product.status, 'active'), eq(vendorProfile.verification, 'verified')];
  if (filters.niche) where.push(eq(product.niche, filters.niche));
  if (filters.sector) where.push(inArray(product.niche, nichesInSector(filters.sector)));
  const q = filters.q?.trim();
  if (q) {
    const like = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    where.push(or(ilike(product.title, like), ilike(product.description, like), ilike(user.company, like), ilike(product.hsCode, like))!);
  }
  return db
    .select({
      ...productColumns,
      vendorCompany: user.company,
      cluster: vendorProfile.cluster,
      certifications: vendorProfile.certifications,
    })
    .from(product)
    .innerJoin(user, eq(user.id, product.vendorId))
    .innerJoin(vendorProfile, eq(vendorProfile.userId, product.vendorId))
    .where(and(...where))
    .orderBy(desc(product.createdAt), desc(product.id))
    .limit(filters.limit ?? 200);
}

/** Public directory of verified vendors. */
export async function listVerifiedVendors() {
  return db
    .select({
      id: user.id,
      company: user.company,
      country: user.country,
      cluster: vendorProfile.cluster,
      niche: vendorProfile.niche,
      certifications: vendorProfile.certifications,
      capacity: vendorProfile.capacity,
      years: vendorProfile.years,
      about: vendorProfile.about,
      productCount: sql<number>`(select count(*)::int from ${product} where ${product.vendorId} = ${user.id} and ${product.status} = 'active')`,
    })
    .from(vendorProfile)
    .innerJoin(user, eq(user.id, vendorProfile.userId))
    .where(eq(vendorProfile.verification, 'verified'))
    .orderBy(asc(user.company));
}

export async function listMyProducts(viewer: CurrentUser) {
  if (viewer.role !== 'vendor') throw forbidden();
  return db.select(productColumns).from(product).where(eq(product.vendorId, viewer.id)).orderBy(desc(product.id));
}

export async function createProduct(viewer: CurrentUser, input: z.infer<typeof productSchema>) {
  if (viewer.role !== 'vendor') throw forbidden();
  const [row] = await db
    .insert(product)
    .values({ ...input, vendorId: viewer.id })
    .returning({ id: product.id });
  return row!.id;
}

export async function deleteProduct(viewer: CurrentUser, id: number) {
  if (viewer.role !== 'vendor' && viewer.role !== 'admin') throw forbidden();
  const condition = viewer.role === 'admin' ? eq(product.id, id) : and(eq(product.id, id), eq(product.vendorId, viewer.id));
  const deleted = await db.delete(product).where(condition).returning({ id: product.id });
  if (!deleted.length) throw notFound('Product');
  await deleteFilesFor('product', id);
}

export async function assertOwnsProduct(viewer: CurrentUser, id: number) {
  const row = await db.query.product.findFirst({ where: and(eq(product.id, id), eq(product.vendorId, viewer.id)), columns: { id: true } });
  if (!row) throw new AppError('You cannot attach files here', 403);
}

/** Headline numbers for the home page and admin control room. */
export async function getStats() {
  const verified = eq(vendorProfile.verification, 'verified');
  const [vendors] = await db
    .select({
      total: count(),
      clusters: countDistinct(sql`nullif(${vendorProfile.cluster}, '')`),
    })
    .from(vendorProfile)
    .where(verified);
  const [products] = await db
    .select({ n: count() })
    .from(product)
    .innerJoin(vendorProfile, eq(vendorProfile.userId, product.vendorId))
    .where(and(eq(product.status, 'active'), verified));
  const [buyers] = await db.select({ n: count() }).from(user).where(eq(user.role, 'buyer'));
  const [openRfqs] = await db.select({ n: count() }).from(rfq).where(eq(rfq.status, 'open'));
  const [orders] = await db.select({ n: count(), value: sum(order.total).mapWith(Number) }).from(order);
  return {
    vendors: vendors?.total ?? 0,
    clusters: vendors?.clusters ?? 0,
    products: products?.n ?? 0,
    buyers: buyers?.n ?? 0,
    openRfqs: openRfqs?.n ?? 0,
    orders: orders?.n ?? 0,
    tradeValue: orders?.value ?? 0,
    niches: NICHES.length,
  };
}
