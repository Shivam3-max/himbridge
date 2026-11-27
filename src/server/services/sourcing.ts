import 'server-only';
import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import type { z } from 'zod';
import { env } from '@/config/env';
import { orderCode } from '@/domain/order-flow';
import { advancePctFor, splitPayments } from '@/domain/payments';
import { nichesInSector, sectorOf } from '@/domain/sectors';
import { OPEN_STAGES, offerTotal, orderTier, sourcingCode, type SourcingStage } from '@/domain/sourcing';
import type { offerSchema, sourcingSchema } from '@/lib/validation';
import { requireVendorProfile, type CurrentUser } from '../auth/session';
import { db } from '../db/client';
import {
  milestone,
  order,
  payment,
  sourcingItem,
  sourcingMessage,
  sourcingOffer,
  sourcingOfferLine,
  sourcingRequest,
  user,
  vendorProfile,
} from '../db/schema';
import { AppError, forbidden, notFound } from '../errors';
import { sendMail } from '../mail';
import { listFilesFor } from './files';

/*
 * Sourcing desk: buyers (brands, designers, importers) describe what they need; vendors in the matching
 * sector send itemised offers; the buyer requests samples and turns one offer into a production order.
 * Himbridge admins see every request, move it through stages and talk with the buyer.
 */

const sectorNiches = (niche: string) => {
  const s = sectorOf(niche);
  return s ? nichesInSector(s) : [niche];
};

/** Best effort: e-mail failures never block the action (every mail is also logged in the outbox). */
const notify = (to: string[], subject: string, body: string) =>
  Promise.all(to.map((t) => sendMail(t, subject, body).catch((e) => console.warn('[sourcing] mail failed', e))));
const adminEmails = async () => (await db.select({ email: user.email }).from(user).where(eq(user.role, 'admin'))).map((r) => r.email);
const link = (id: number) => `${env.APP_URL}/dashboard/sourcing/${id}`;

// ── Create ───────────────────────────────────────────────────

export async function createRequest(viewer: CurrentUser, input: z.infer<typeof sourcingSchema>) {
  if (viewer.role !== 'buyer') throw forbidden('Only buyer accounts can start sourcing requests');
  const { items, ...req } = input;
  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(sourcingRequest)
      .values({ ...req, buyerId: viewer.id })
      .returning({ id: sourcingRequest.id, createdAt: sourcingRequest.createdAt });
    await tx
      .update(sourcingRequest)
      .set({ code: sourcingCode(row!.id, row!.createdAt.getFullYear()) })
      .where(eq(sourcingRequest.id, row!.id));
    await tx.insert(sourcingItem).values(items.map((it, i) => ({ ...it, requestId: row!.id, position: i })));
    return row!.id;
  });
  await notify(
    await adminEmails(),
    `New sourcing request: ${input.title}`,
    `${viewer.company} (${viewer.country}) needs ${items.length} item(s) delivered to ${input.destination}.\n\n${link(id)}`,
  );
  return id;
}

// ── Read ─────────────────────────────────────────────────────

const requestColumns = {
  id: sourcingRequest.id,
  code: sourcingRequest.code,
  buyerId: sourcingRequest.buyerId,
  kind: sourcingRequest.kind,
  niche: sourcingRequest.niche,
  title: sourcingRequest.title,
  brief: sourcingRequest.brief,
  storeUrl: sourcingRequest.storeUrl,
  destination: sourcingRequest.destination,
  deliverBy: sourcingRequest.deliverBy,
  shipping: sourcingRequest.shipping,
  terms: sourcingRequest.terms,
  reorder: sourcingRequest.reorder,
  samplesNeeded: sourcingRequest.samplesNeeded,
  privateLabel: sourcingRequest.privateLabel,
  customPackaging: sourcingRequest.customPackaging,
  stage: sourcingRequest.stage,
  createdAt: sourcingRequest.createdAt,
  buyerCompany: user.company,
  buyerCountry: user.country,
  buyerType: user.buyerType,
};

const baseQuery = () => db.select(requestColumns).from(sourcingRequest).innerJoin(user, eq(user.id, sourcingRequest.buyerId));

async function itemsFor(ids: number[]) {
  if (!ids.length) return [];
  return db
    .select()
    .from(sourcingItem)
    .where(inArray(sourcingItem.requestId, ids))
    .orderBy(asc(sourcingItem.position), asc(sourcingItem.id));
}

async function offersFor(ids: number[], vendorId?: string) {
  if (!ids.length) return [];
  const offers = await db
    .select({
      offer: sourcingOffer,
      vendorCompany: user.company,
      cluster: vendorProfile.cluster,
      certifications: vendorProfile.certifications,
      verification: vendorProfile.verification,
      years: vendorProfile.years,
    })
    .from(sourcingOffer)
    .innerJoin(user, eq(user.id, sourcingOffer.vendorId))
    .innerJoin(vendorProfile, eq(vendorProfile.userId, sourcingOffer.vendorId))
    .where(and(inArray(sourcingOffer.requestId, ids), vendorId ? eq(sourcingOffer.vendorId, vendorId) : undefined))
    .orderBy(asc(sourcingOffer.id));
  const lines = offers.length
    ? await db
        .select()
        .from(sourcingOfferLine)
        .where(
          inArray(
            sourcingOfferLine.offerId,
            offers.map((o) => o.offer.id),
          ),
        )
    : [];
  return offers.map((o) => ({
    ...o.offer,
    vendorCompany: o.vendorCompany,
    cluster: o.cluster,
    certifications: o.certifications,
    verification: o.verification,
    years: o.years,
    lines: lines.filter((l) => l.offerId === o.offer.id).map((l) => ({ itemId: l.itemId, unitPrice: l.unitPrice })),
  }));
}

type BaseRow = Awaited<ReturnType<typeof baseQuery>>[number];

async function assemble(rows: BaseRow[], vendorId?: string) {
  const ids = rows.map((r) => r.id);
  const [items, offers, files, msgCounts] = await Promise.all([
    itemsFor(ids),
    offersFor(ids, vendorId),
    listFilesFor(['sourcing'], ids),
    ids.length
      ? db
          .select({ requestId: sourcingMessage.requestId, n: sql<number>`count(*)::int` })
          .from(sourcingMessage)
          .where(inArray(sourcingMessage.requestId, ids))
          .groupBy(sourcingMessage.requestId)
      : Promise.resolve([]),
  ]);
  return rows.map((r) => {
    const its = items.filter((i) => i.requestId === r.id);
    const ofs = offers
      .filter((o) => o.requestId === r.id)
      .map((o) => ({ ...o, total: offerTotal(its, o.lines) }))
      .sort((a, b) => a.total - b.total);
    return {
      ...r,
      items: its,
      offers: ofs,
      attachments: files.get(r.id) ?? [],
      messageCount: msgCounts.find((m) => m.requestId === r.id)?.n ?? 0,
    };
  });
}

/** Buyer: own requests. Admin: every request. */
export async function listRequests(viewer: CurrentUser) {
  if (viewer.role !== 'buyer' && viewer.role !== 'admin') throw forbidden();
  const rows = await baseQuery()
    .where(viewer.role === 'buyer' ? eq(sourcingRequest.buyerId, viewer.id) : undefined)
    .orderBy(desc(sourcingRequest.id));
  return assemble(rows);
}
export type SourcingRequestView = Awaited<ReturnType<typeof listRequests>>[number];

/** Vendor: open requests in the vendor's sector, own niche first, each with the vendor's own offer if any. */
export async function listVendorRequests(viewer: CurrentUser) {
  const v = requireVendorProfile(viewer);
  const rows = await baseQuery()
    .where(and(inArray(sourcingRequest.stage, OPEN_STAGES), inArray(sourcingRequest.niche, sectorNiches(v.vendor.niche))))
    .orderBy(desc(sql`${sourcingRequest.niche} = ${v.vendor.niche}`), desc(sourcingRequest.id));
  return assemble(rows, v.id);
}

/** One request, if this viewer may see it. Vendors only see their own offer and never the message thread. */
export async function getRequest(viewer: CurrentUser, id: number) {
  const [row] = await baseQuery().where(eq(sourcingRequest.id, id));
  if (!row) throw notFound('Sourcing request');
  if (viewer.role === 'buyer' && row.buyerId !== viewer.id) throw notFound('Sourcing request');
  if (viewer.role === 'logistics') throw notFound('Sourcing request');
  let vendorId: string | undefined;
  if (viewer.role === 'vendor') {
    const v = requireVendorProfile(viewer);
    if (!sectorNiches(v.vendor.niche).includes(row.niche)) throw notFound('Sourcing request');
    vendorId = v.id;
  }
  const [full] = await assemble([row], vendorId);
  const messages =
    viewer.role === 'vendor'
      ? []
      : await db
          .select({
            id: sourcingMessage.id,
            body: sourcingMessage.body,
            createdAt: sourcingMessage.createdAt,
            authorName: user.name,
            authorRole: user.role,
            authorCompany: user.company,
          })
          .from(sourcingMessage)
          .leftJoin(user, eq(user.id, sourcingMessage.authorId))
          .where(eq(sourcingMessage.requestId, id))
          .orderBy(asc(sourcingMessage.id));
  const orderRow = await db.query.order.findFirst({ where: eq(order.sourcingId, id), columns: { code: true } });
  return { ...full!, messages, orderCode: orderRow?.code ?? null };
}
export type SourcingDetail = Awaited<ReturnType<typeof getRequest>>;

// ── Vendor offers ────────────────────────────────────────────

export async function submitOffer(viewer: CurrentUser, requestId: number, input: z.infer<typeof offerSchema>) {
  const v = requireVendorProfile(viewer);
  if (v.vendor.verification !== 'verified') throw new AppError('Your vendor profile must be verified before you can quote', 403);
  const req = await db.query.sourcingRequest.findFirst({ where: eq(sourcingRequest.id, requestId) });
  if (!req || !OPEN_STAGES.includes(req.stage)) throw new AppError('This request is no longer open for offers', 404);
  if (!sectorNiches(v.vendor.niche).includes(req.niche)) throw new AppError('This request is for a different product sector', 403);
  const itemIds = new Set(
    (await db.select({ id: sourcingItem.id }).from(sourcingItem).where(eq(sourcingItem.requestId, requestId))).map((i) => i.id),
  );
  const prices = input.prices.filter((p) => itemIds.has(p.itemId));
  if (!prices.length) throw new AppError('Price at least one item');

  const { prices: _p, ...fields } = input;
  await db.transaction(async (tx) => {
    const [o] = await tx
      .insert(sourcingOffer)
      .values({ ...fields, requestId, vendorId: v.id })
      .onConflictDoUpdate({
        target: [sourcingOffer.requestId, sourcingOffer.vendorId],
        set: { ...fields, status: 'submitted' },
      })
      .returning({ id: sourcingOffer.id });
    await tx.delete(sourcingOfferLine).where(eq(sourcingOfferLine.offerId, o!.id));
    await tx.insert(sourcingOfferLine).values(prices.map((p) => ({ offerId: o!.id, itemId: p.itemId, unitPrice: p.unitPrice })));
    if (req.stage === 'submitted' || req.stage === 'matching') {
      await tx.update(sourcingRequest).set({ stage: 'offers' }).where(eq(sourcingRequest.id, requestId));
    }
  });
  const buyer = await db.query.user.findFirst({ where: eq(user.id, req.buyerId), columns: { email: true } });
  if (buyer) await notify([buyer.email], `New offer on ${req.title}`, `A verified manufacturer has sent an offer.\n\n${link(requestId)}`);
}

// ── Buyer decisions ──────────────────────────────────────────

async function buyerOffer(viewer: CurrentUser, offerId: number) {
  if (viewer.role !== 'buyer') throw forbidden();
  const [row] = await db
    .select({ offer: sourcingOffer, req: sourcingRequest })
    .from(sourcingOffer)
    .innerJoin(sourcingRequest, eq(sourcingRequest.id, sourcingOffer.requestId))
    .where(eq(sourcingOffer.id, offerId));
  if (!row || row.req.buyerId !== viewer.id) throw notFound('Offer');
  return row;
}

export async function requestSamples(viewer: CurrentUser, offerId: number) {
  const { offer, req } = await buyerOffer(viewer, offerId);
  if (!OPEN_STAGES.includes(req.stage)) throw new AppError('This request is closed', 409);
  await db.update(sourcingOffer).set({ status: 'sample_requested' }).where(eq(sourcingOffer.id, offer.id));
  await db.update(sourcingRequest).set({ stage: 'sampling' }).where(eq(sourcingRequest.id, req.id));
  const vendor = await db.query.user.findFirst({ where: eq(user.id, offer.vendorId), columns: { email: true } });
  await notify(
    [...(vendor ? [vendor.email] : []), ...(await adminEmails())],
    `Samples requested: ${req.title}`,
    `The buyer has asked for samples on ${req.code}. Himbridge will share the courier details.\n\n${link(req.id)}`,
  );
}

/**
 * Turns an offer into a production order (same flow as an accepted RFQ quote): the request is marked
 * ordered, other offers are declined, and an order with milestones and payments is created.
 */
export async function placeOrder(viewer: CurrentUser, offerId: number) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ offer: sourcingOffer, req: sourcingRequest })
      .from(sourcingOffer)
      .innerJoin(sourcingRequest, eq(sourcingRequest.id, sourcingOffer.requestId))
      .where(eq(sourcingOffer.id, offerId))
      .for('update', { of: sourcingRequest });
    if (viewer.role !== 'buyer' || !row || row.req.buyerId !== viewer.id) throw notFound('Offer');
    if (!OPEN_STAGES.includes(row.req.stage)) throw new AppError('An order has already been placed for this request', 409);

    const items = await tx.select().from(sourcingItem).where(eq(sourcingItem.requestId, row.req.id));
    const lines = await tx.select().from(sourcingOfferLine).where(eq(sourcingOfferLine.offerId, offerId));
    const priced = items.filter((i) => lines.some((l) => l.itemId === i.id));
    const total = offerTotal(priced, lines);
    const quantity = priced.reduce((s, i) => s + i.quantity, 0);
    if (!total || !quantity) throw new AppError('This offer has no priced items');

    await tx
      .update(sourcingOffer)
      .set({ status: sql`case when ${sourcingOffer.id} = ${offerId} then 'accepted' else 'declined' end` })
      .where(eq(sourcingOffer.requestId, row.req.id));
    await tx.update(sourcingRequest).set({ stage: 'ordered' }).where(eq(sourcingRequest.id, row.req.id));

    const single = priced.length === 1 ? priced[0]! : null;
    const [created] = await tx
      .insert(order)
      .values({
        sourcingId: row.req.id,
        buyerId: viewer.id,
        vendorId: row.offer.vendorId,
        title: single ? row.req.title : `${row.req.title} (${priced.length} items)`,
        quantity,
        unit: single?.unit ?? 'pcs',
        unitPrice: Math.round((total / quantity) * 100) / 100,
        total,
        destination: row.req.destination,
        incoterm: row.req.terms,
      })
      .returning({ id: order.id, createdAt: order.createdAt });
    const code = orderCode(created!.id, created!.createdAt.getFullYear());
    await tx.update(order).set({ code }).where(eq(order.id, created!.id));
    await tx.insert(milestone).values({
      orderId: created!.id,
      status: 'confirmed',
      note: `Production order placed from sourcing request ${row.req.code}.`,
      byUserId: viewer.id,
    });
    await tx.insert(payment).values(splitPayments(total, advancePctFor(orderTier(total))).map((p) => ({ ...p, orderId: created!.id })));
    return code;
  });
}

export async function closeRequest(viewer: CurrentUser, id: number) {
  const req = await db.query.sourcingRequest.findFirst({ where: eq(sourcingRequest.id, id) });
  if (!req || (viewer.role !== 'admin' && req.buyerId !== viewer.id)) throw notFound('Sourcing request');
  if (req.stage === 'ordered') throw new AppError('This request already has an order', 409);
  await db.update(sourcingRequest).set({ stage: 'closed' }).where(eq(sourcingRequest.id, id));
  await db
    .update(sourcingOffer)
    .set({ status: 'declined' })
    .where(and(eq(sourcingOffer.requestId, id), ne(sourcingOffer.status, 'accepted')));
}

/** Admin moves a request along (e.g. submitted → matching) or reopens a closed one. */
export async function setStage(viewer: CurrentUser, id: number, stage: SourcingStage) {
  if (viewer.role !== 'admin') throw forbidden();
  if (stage === 'ordered') throw new AppError('Orders are placed by the buyer from an offer');
  const req = await db.query.sourcingRequest.findFirst({ where: eq(sourcingRequest.id, id), columns: { stage: true } });
  if (!req) throw notFound('Sourcing request');
  if (req.stage === 'ordered') throw new AppError('This request already has an order', 409);
  await db.update(sourcingRequest).set({ stage }).where(eq(sourcingRequest.id, id));
}

// ── Messages ─────────────────────────────────────────────────

export async function addMessage(viewer: CurrentUser, requestId: number, body: string) {
  const req = await db.query.sourcingRequest.findFirst({ where: eq(sourcingRequest.id, requestId) });
  if (!req || (viewer.role !== 'admin' && req.buyerId !== viewer.id)) throw notFound('Sourcing request');
  await db.insert(sourcingMessage).values({ requestId, authorId: viewer.id, body });
  const to =
    viewer.role === 'admin'
      ? ((await db.query.user.findFirst({ where: eq(user.id, req.buyerId), columns: { email: true } }))?.email ?? null)
      : null;
  await notify(to ? [to] : await adminEmails(), `Message on ${req.code}: ${req.title}`, `${viewer.name}: ${body}\n\n${link(requestId)}`);
}

/** Counts for dashboards. */
export async function sourcingStats() {
  const rows = await db
    .select({ stage: sourcingRequest.stage, n: sql<number>`count(*)::int` })
    .from(sourcingRequest)
    .groupBy(sourcingRequest.stage);
  return Object.fromEntries(rows.map((r) => [r.stage, r.n])) as Partial<Record<SourcingStage, number>>;
}
