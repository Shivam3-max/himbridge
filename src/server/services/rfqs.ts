import 'server-only';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import type { z } from 'zod';
import { orderCode } from '@/domain/order-flow';
import { orderTotal, splitPayments } from '@/domain/payments';
import type { quoteSchema, rfqSchema } from '@/lib/validation';
import { requireVendorProfile, type CurrentUser } from '../auth/session';
import { db } from '../db/client';
import { milestone, order, payment, quote, rfq, user, vendorProfile } from '../db/schema';
import { AppError, forbidden, notFound } from '../errors';
import { listFilesFor } from './files';
import { nichesInSector, sectorOf } from '@/domain/sectors';

/** Vendors see and quote on RFQs anywhere in their own sector (e.g. a rug maker sees all Home & Living RFQs). */
const sectorNiches = (vendorNiche: string) => {
  const s = sectorOf(vendorNiche);
  return s ? nichesInSector(s) : [vendorNiche];
};

const rfqColumns = {
  id: rfq.id,
  niche: rfq.niche,
  title: rfq.title,
  details: rfq.details,
  quantity: rfq.quantity,
  unit: rfq.unit,
  destination: rfq.destination,
  targetPrice: rfq.targetPrice,
  status: rfq.status,
  createdAt: rfq.createdAt,
  buyerCompany: user.company,
  buyerCountry: user.country,
  quoteCount: sql<number>`(select count(*)::int from ${quote} where ${quote.rfqId} = ${rfq.id})`,
};

export async function createRfq(viewer: CurrentUser, input: z.infer<typeof rfqSchema>) {
  if (viewer.role !== 'buyer') throw forbidden('Only buyer accounts can post RFQs');
  const [row] = await db
    .insert(rfq)
    .values({ ...input, buyerId: viewer.id })
    .returning({ id: rfq.id });
  return row!.id;
}

/** Quotes on the given RFQs, cheapest first, with the vendor's company details. */
async function quotesFor(rfqIds: number[]) {
  if (!rfqIds.length) return [];
  return db
    .select({
      id: quote.id,
      rfqId: quote.rfqId,
      unitPrice: quote.unitPrice,
      leadDays: quote.leadDays,
      note: quote.note,
      status: quote.status,
      vendorCompany: user.company,
      vendorNiche: vendorProfile.niche,
      certifications: vendorProfile.certifications,
    })
    .from(quote)
    .innerJoin(user, eq(user.id, quote.vendorId))
    .innerJoin(vendorProfile, eq(vendorProfile.userId, quote.vendorId))
    .where(inArray(quote.rfqId, rfqIds))
    .orderBy(asc(quote.unitPrice));
}

/** Buyer view (own RFQs) or admin view (all RFQs), each with quotes and reference files. */
export async function listRfqsWithQuotes(viewer: CurrentUser) {
  if (viewer.role !== 'buyer' && viewer.role !== 'admin') throw forbidden();
  const rows = await db
    .select(rfqColumns)
    .from(rfq)
    .innerJoin(user, eq(user.id, rfq.buyerId))
    .where(viewer.role === 'buyer' ? eq(rfq.buyerId, viewer.id) : undefined)
    .orderBy(desc(rfq.id));
  const ids = rows.map((r) => r.id);
  const [quotes, files] = await Promise.all([quotesFor(ids), listFilesFor(['rfq'], ids)]);
  return rows.map((r) => ({ ...r, quotes: quotes.filter((q) => q.rfqId === r.id), attachments: files.get(r.id) ?? [] }));
}
export type RfqWithQuotes = Awaited<ReturnType<typeof listRfqsWithQuotes>>[number];

/** Vendor inbox: open RFQs in the vendor's sector, own niche first, with the vendor's own quote if any. */
export async function listRfqInbox(viewer: CurrentUser) {
  const v = requireVendorProfile(viewer);
  const rows = await db
    .select(rfqColumns)
    .from(rfq)
    .innerJoin(user, eq(user.id, rfq.buyerId))
    .where(and(eq(rfq.status, 'open'), inArray(rfq.niche, sectorNiches(v.vendor.niche))))
    .orderBy(desc(sql`${rfq.niche} = ${v.vendor.niche}`), desc(rfq.id));
  const ids = rows.map((r) => r.id);
  const [mine, files] = await Promise.all([
    ids.length
      ? db
          .select()
          .from(quote)
          .where(and(inArray(quote.rfqId, ids), eq(quote.vendorId, v.id)))
      : Promise.resolve([]),
    listFilesFor(['rfq'], ids),
  ]);
  return rows.map((r) => ({ ...r, myQuote: mine.find((q) => q.rfqId === r.id) ?? null, attachments: files.get(r.id) ?? [] }));
}
export type InboxRfq = Awaited<ReturnType<typeof listRfqInbox>>[number];

export async function submitQuote(viewer: CurrentUser, rfqId: number, input: z.infer<typeof quoteSchema>) {
  const v = requireVendorProfile(viewer);
  if (v.vendor.verification !== 'verified') throw new AppError('Your vendor profile must be verified before you can quote', 403);
  const target = await db.query.rfq.findFirst({ where: eq(rfq.id, rfqId) });
  if (!target || target.status !== 'open') throw new AppError('This RFQ is not open', 404);
  if (!sectorNiches(v.vendor.niche).includes(target.niche)) throw new AppError('This RFQ is for a different product sector', 403);
  await db
    .insert(quote)
    .values({ rfqId, vendorId: v.id, ...input })
    .onConflictDoUpdate({
      target: [quote.rfqId, quote.vendorId],
      set: { unitPrice: input.unitPrice, leadDays: input.leadDays, note: input.note, createdAt: new Date() },
    });
}

/**
 * Buyer accepts a quote: the RFQ is awarded, other quotes are declined, and an order is created
 * with its first milestone and payment schedule — all in one transaction.
 */
export async function acceptQuote(viewer: CurrentUser, quoteId: number) {
  if (viewer.role !== 'buyer') throw forbidden();
  return db.transaction(async (tx) => {
    const [q] = await tx
      .select({ quote, rfq })
      .from(quote)
      .innerJoin(rfq, eq(rfq.id, quote.rfqId))
      .where(eq(quote.id, quoteId))
      .for('update', { of: rfq });
    if (!q || q.rfq.buyerId !== viewer.id) throw notFound('Quote');
    if (q.rfq.status !== 'open') throw new AppError('This RFQ has already been awarded', 409);

    await tx
      .update(quote)
      .set({ status: sql`case when ${quote.id} = ${q.quote.id} then 'accepted' else 'rejected' end` })
      .where(eq(quote.rfqId, q.rfq.id));
    await tx.update(rfq).set({ status: 'awarded' }).where(eq(rfq.id, q.rfq.id));

    const total = orderTotal(q.quote.unitPrice, q.rfq.quantity);
    const [created] = await tx
      .insert(order)
      .values({
        rfqId: q.rfq.id,
        quoteId: q.quote.id,
        buyerId: viewer.id,
        vendorId: q.quote.vendorId,
        title: q.rfq.title,
        quantity: q.rfq.quantity,
        unit: q.rfq.unit,
        unitPrice: q.quote.unitPrice,
        total,
        destination: q.rfq.destination,
      })
      .returning({ id: order.id, createdAt: order.createdAt });
    const code = orderCode(created!.id, created!.createdAt.getFullYear());
    await tx.update(order).set({ code }).where(eq(order.id, created!.id));
    await tx
      .insert(milestone)
      .values({ orderId: created!.id, status: 'confirmed', note: 'Buyer accepted quotation.', byUserId: viewer.id });
    await tx.insert(payment).values(splitPayments(total).map((p) => ({ ...p, orderId: created!.id })));
    return code;
  });
}
