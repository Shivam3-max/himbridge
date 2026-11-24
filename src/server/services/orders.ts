import 'server-only';
import { and, asc, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { z } from 'zod';
import { checkTransition } from '@/domain/order-flow';
import { primaryHs } from '@/domain/niches';
import type { assignLogisticsSchema, milestoneSchema } from '@/lib/validation';
import type { CurrentUser } from '../auth/session';
import { db } from '../db/client';
import { file, milestone, order, payment, quote, rfq, user, vendorProfile } from '../db/schema';
import { AppError, forbidden, notFound } from '../errors';

/** Which orders a user may see: everything for admins, otherwise the orders they are a party to. */
function orderScope(viewer: CurrentUser): SQL | undefined {
  switch (viewer.role) {
    case 'admin':
      return undefined;
    case 'buyer':
      return eq(order.buyerId, viewer.id);
    case 'vendor':
      return eq(order.vendorId, viewer.id);
    case 'logistics':
      return eq(order.logisticsId, viewer.id);
  }
}

export async function findOrderFor(viewer: CurrentUser, orderId: number) {
  return db.query.order.findFirst({ where: and(eq(order.id, orderId), orderScope(viewer)) });
}

const buyer = alias(user, 'buyer');
const vendor = alias(user, 'vendor');
const logistics = alias(user, 'logistics');
const actor = alias(user, 'actor');

/** Orders visible to the user, newest first, with parties, milestones, payments and uploaded documents. */
export async function listOrders(viewer: CurrentUser) {
  const rows = await db
    .select({
      order,
      buyerCompany: buyer.company,
      buyerCountry: buyer.country,
      vendorCompany: vendor.company,
      vendorOrigin: vendorProfile.origin,
      logisticsCompany: logistics.company,
    })
    .from(order)
    .innerJoin(buyer, eq(buyer.id, order.buyerId))
    .innerJoin(vendor, eq(vendor.id, order.vendorId))
    .leftJoin(vendorProfile, eq(vendorProfile.userId, order.vendorId))
    .leftJoin(logistics, eq(logistics.id, order.logisticsId))
    .where(orderScope(viewer))
    .orderBy(desc(order.id));

  const ids = rows.map((r) => r.order.id);
  if (!ids.length) return [];
  const [milestones, payments, documents] = await Promise.all([
    db
      .select({
        orderId: milestone.orderId,
        status: milestone.status,
        note: milestone.note,
        createdAt: milestone.createdAt,
        byCompany: actor.company,
      })
      .from(milestone)
      .leftJoin(actor, eq(actor.id, milestone.byUserId))
      .where(inArray(milestone.orderId, ids))
      .orderBy(asc(milestone.createdAt), asc(milestone.id)),
    db
      .select()
      .from(payment)
      .where(inArray(payment.orderId, ids))
      .orderBy(sql`case ${payment.stage} when 'advance' then 0 else 1 end`),
    db
      .select({
        id: file.id,
        refId: file.refId,
        kind: file.kind,
        label: file.label,
        name: file.name,
        mime: file.mime,
        size: file.size,
        createdAt: file.createdAt,
        byCompany: actor.company,
      })
      .from(file)
      .innerJoin(actor, eq(actor.id, file.ownerId))
      .where(and(inArray(file.kind, ['qc', 'shipping']), inArray(file.refId, ids)))
      .orderBy(asc(file.id)),
  ]);

  return rows.map((r) => ({
    ...r.order,
    buyerCompany: r.buyerCompany,
    buyerCountry: r.buyerCountry,
    vendorCompany: r.vendorCompany,
    vendorOrigin: r.vendorOrigin,
    logisticsCompany: r.logisticsCompany,
    milestones: milestones.filter((m) => m.orderId === r.order.id),
    payments: payments.filter((p) => p.orderId === r.order.id),
    documents: documents.filter((d) => d.refId === r.order.id),
  }));
}
export type OrderDetail = Awaited<ReturnType<typeof listOrders>>[number];

/** Moves an order to its next milestone, enforcing who may do it and the payment gates. */
export async function updateMilestone(viewer: CurrentUser, orderId: number, input: z.infer<typeof milestoneSchema>) {
  if (!['vendor', 'logistics', 'admin'].includes(viewer.role)) throw forbidden();
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(order)
      .where(and(eq(order.id, orderId), orderScope(viewer)))
      .for('update');
    if (!current) throw notFound('Order');
    const paid = await tx
      .select({ stage: payment.stage })
      .from(payment)
      .where(and(eq(payment.orderId, orderId), eq(payment.status, 'received')));
    const error = checkTransition({
      role: viewer.role,
      current: current.status,
      next: input.status,
      hasLogistics: !!current.logisticsId,
      advancePaid: paid.some((p) => p.stage === 'advance'),
      balancePaid: paid.some((p) => p.stage === 'balance'),
    });
    if (error) throw new AppError(error, 409);
    await tx.update(order).set({ status: input.status }).where(eq(order.id, orderId));
    await tx.insert(milestone).values({ orderId, status: input.status, note: input.note, byUserId: viewer.id });
  });
}

export async function assignLogistics(viewer: CurrentUser, orderId: number, input: z.infer<typeof assignLogisticsSchema>) {
  if (viewer.role !== 'admin') throw forbidden();
  const partner = await db.query.user.findFirst({
    where: and(eq(user.id, input.logisticsId), eq(user.role, 'logistics')),
    columns: { id: true },
  });
  if (!partner) throw new AppError('Choose a logistics partner');
  const updated = await db
    .update(order)
    .set({ logisticsId: partner.id, incoterm: input.incoterm, mode: input.mode, originPort: input.originPort, destPort: input.destPort })
    .where(eq(order.id, orderId))
    .returning({ id: order.id });
  if (!updated.length) throw notFound('Order');
}

export async function listLogisticsPartners() {
  return db
    .select({ id: user.id, company: user.company, country: user.country })
    .from(user)
    .where(and(eq(user.role, 'logistics'), eq(user.status, 'active')))
    .orderBy(asc(user.company));
}

/** Public tracking by order code. Party names are never shown publicly. */
export async function trackOrder(code: string) {
  const [o] = await db
    .select({
      id: order.id,
      code: order.code,
      title: order.title,
      status: order.status,
      destination: order.destination,
      incoterm: order.incoterm,
      mode: order.mode,
      originPort: order.originPort,
      destPort: order.destPort,
      createdAt: order.createdAt,
      vendorOrigin: vendorProfile.origin,
    })
    .from(order)
    .leftJoin(vendorProfile, eq(vendorProfile.userId, order.vendorId))
    .where(eq(order.code, code.trim().toUpperCase()));
  if (!o) return null;
  const milestones = await db
    .select({ status: milestone.status, note: milestone.note, createdAt: milestone.createdAt })
    .from(milestone)
    .where(eq(milestone.orderId, o.id))
    .orderBy(asc(milestone.createdAt), asc(milestone.id));
  const { id: _id, ...publicOrder } = o;
  return { ...publicOrder, milestones };
}

/** Everything needed to print a proforma / commercial invoice or packing list. */
export async function getOrderDocument(viewer: CurrentUser, orderId: number) {
  const [o] = await db
    .select({
      order,
      buyerCompany: buyer.company,
      buyerName: buyer.name,
      buyerEmail: buyer.email,
      buyerCountry: buyer.country,
      buyerPhone: buyer.phone,
      vendorCompany: vendor.company,
      vendorCountry: vendor.country,
      vendorCluster: vendorProfile.cluster,
      vendorOrigin: vendorProfile.origin,
      leadDays: quote.leadDays,
      niche: rfq.niche,
      details: rfq.details,
    })
    .from(order)
    .innerJoin(buyer, eq(buyer.id, order.buyerId))
    .innerJoin(vendor, eq(vendor.id, order.vendorId))
    .leftJoin(vendorProfile, eq(vendorProfile.userId, order.vendorId))
    .leftJoin(quote, eq(quote.id, order.quoteId))
    .leftJoin(rfq, eq(rfq.id, order.rfqId))
    .where(and(eq(order.id, orderId), orderScope(viewer)));
  if (!o) return null;
  const payments = await db.select().from(payment).where(eq(payment.orderId, orderId));
  return { ...o, payments, hs: primaryHs(o.niche) };
}
export type OrderDocument = NonNullable<Awaited<ReturnType<typeof getOrderDocument>>>;
