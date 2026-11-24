import 'server-only';
import { and, eq, ne } from 'drizzle-orm';
import { hasReached } from '@/domain/order-flow';
import type { CurrentUser } from '../auth/session';
import { db } from '../db/client';
import { order, payment } from '../db/schema';
import { AppError, forbidden, notFound } from '../errors';

/** Buyer reports a bank transfer / SWIFT / LC reference for a payment stage. */
export async function submitPayment(viewer: CurrentUser, paymentId: number, reference: string) {
  if (viewer.role !== 'buyer') throw forbidden();
  const [row] = await db
    .select({ payment, buyerId: order.buyerId, orderStatus: order.status })
    .from(payment)
    .innerJoin(order, eq(order.id, payment.orderId))
    .where(eq(payment.id, paymentId));
  if (!row || row.buyerId !== viewer.id) throw notFound('Payment');
  if (row.payment.status === 'received') throw new AppError('This payment is already confirmed', 409);
  if (row.payment.stage === 'balance' && !hasReached(row.orderStatus, 'qc_passed'))
    throw new AppError('The balance falls due after the QC inspection is passed', 409);
  await db.update(payment).set({ status: 'submitted', reference }).where(eq(payment.id, paymentId));
}

/** Himbridge operations confirm the funds arrived. */
export async function confirmPayment(viewer: CurrentUser, paymentId: number) {
  if (viewer.role !== 'admin') throw forbidden();
  const updated = await db
    .update(payment)
    .set({ status: 'received', confirmedById: viewer.id })
    .where(and(eq(payment.id, paymentId), ne(payment.status, 'received')))
    .returning({ id: payment.id });
  if (!updated.length) throw new AppError('Payment not found or already confirmed', 404);
}
