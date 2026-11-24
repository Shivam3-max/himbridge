'use server';

import { FILE_KINDS } from '@/domain/files';
import {
  assignLogisticsSchema,
  milestoneSchema,
  noticeSchema,
  paymentReferenceSchema,
  productSchema,
  quoteSchema,
  rfqSchema,
  vendorStatusSchema,
} from '@/lib/validation';
import { formFiles, formObject, runAction, type ActionResult } from '@/server/action';
import { requireUser } from '@/server/auth/session';
import { AppError } from '@/server/errors';
import * as admin from '@/server/services/admin';
import * as catalog from '@/server/services/catalog';
import * as files from '@/server/services/files';
import * as orders from '@/server/services/orders';
import * as payments from '@/server/services/payments';
import * as rfqs from '@/server/services/rfqs';

/*
 * Server actions called by dashboard forms. Each one: authenticate → validate → call a service → revalidate.
 * Business rules live in src/server/services and src/domain, not here.
 */

const DASH = ['/dashboard'];
const id = (v: unknown) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new AppError('Missing reference');
  return n;
};

// ── RFQs & quotes ────────────────────────────────────────────

export async function createRfq(_prev: ActionResult<number> | null, fd: FormData): Promise<ActionResult<number>> {
  return runAction(
    async () => {
      const me = await requireUser('buyer');
      const rfqId = await rfqs.createRfq(me, rfqSchema.parse(formObject(fd)));
      const refs = formFiles(fd, 'refs');
      if (refs.length) await files.uploadFiles(me, { kind: 'rfq', refId: rfqId }, refs);
      return rfqId;
    },
    { revalidate: DASH, message: 'RFQ posted — matched vendors have been notified' },
  );
}

export async function submitQuote(rfqId: number, _prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return runAction(async () => rfqs.submitQuote(await requireUser('vendor'), id(rfqId), quoteSchema.parse(formObject(fd))), {
    revalidate: DASH,
    message: 'Quotation sent to buyer',
  });
}

export async function acceptQuote(quoteId: number): Promise<ActionResult<string>> {
  return runAction(async () => rfqs.acceptQuote(await requireUser('buyer'), id(quoteId)), { revalidate: DASH });
}

// ── Products ─────────────────────────────────────────────────

export async function createProduct(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return runAction(
    async () => {
      const me = await requireUser('vendor');
      const productId = await catalog.createProduct(me, productSchema.parse(formObject(fd)));
      const photos = formFiles(fd, 'photos').slice(0, 6);
      if (photos.length) await files.uploadFiles(me, { kind: 'product', refId: productId }, photos);
    },
    { revalidate: ['/dashboard', '/marketplace', '/'], message: 'Product saved' },
  );
}

export async function deleteProduct(productId: number): Promise<ActionResult> {
  return runAction(async () => catalog.deleteProduct(await requireUser('vendor', 'admin'), id(productId)), {
    revalidate: ['/dashboard', '/marketplace', '/'],
    message: 'Product removed',
  });
}

// ── Orders, logistics & payments ─────────────────────────────

export async function updateMilestone(orderId: number, _prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return runAction(async () => orders.updateMilestone(await requireUser(), id(orderId), milestoneSchema.parse(formObject(fd))), {
    revalidate: [...DASH, '/track'],
    message: 'Milestone updated',
  });
}

export async function assignLogistics(orderId: number, _prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return runAction(
    async () => orders.assignLogistics(await requireUser('admin'), id(orderId), assignLogisticsSchema.parse(formObject(fd))),
    {
      revalidate: DASH,
      message: 'Logistics saved',
    },
  );
}

export async function submitPayment(paymentId: number, _prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return runAction(
    async () => payments.submitPayment(await requireUser('buyer'), id(paymentId), paymentReferenceSchema.parse(formObject(fd)).reference),
    { revalidate: DASH, message: 'Payment reference sent — Himbridge will confirm receipt' },
  );
}

export async function confirmPayment(paymentId: number): Promise<ActionResult> {
  return runAction(async () => payments.confirmPayment(await requireUser('admin'), id(paymentId)), {
    revalidate: DASH,
    message: 'Payment confirmed',
  });
}

// ── Files ────────────────────────────────────────────────────

export async function uploadFiles(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return runAction(
    async () => {
      const me = await requireUser();
      const kind = String(fd.get('kind') ?? '');
      if (!(FILE_KINDS as readonly string[]).includes(kind)) throw new AppError('Unknown upload type');
      const refRaw = fd.get('refId');
      const refId = refRaw ? Number(refRaw) : null;
      await files.uploadFiles(
        me,
        { kind: kind as (typeof FILE_KINDS)[number], refId, label: String(fd.get('label') ?? '') },
        formFiles(fd, 'files'),
      );
    },
    { revalidate: ['/dashboard', '/marketplace', '/'], message: 'Uploaded' },
  );
}

export async function deleteFile(fileId: number): Promise<ActionResult> {
  return runAction(async () => files.deleteFile(await requireUser(), id(fileId)), {
    revalidate: ['/dashboard', '/marketplace'],
    message: 'File removed',
  });
}

// ── Admin ────────────────────────────────────────────────────

export async function setVendorStatus(vendorId: string, status: string): Promise<ActionResult> {
  return runAction(async () => admin.setVendorStatus(await requireUser('admin'), vendorId, vendorStatusSchema.parse(status)), {
    revalidate: ['/dashboard', '/vendors', '/marketplace', '/'],
    message: `Vendor ${status}`,
  });
}

export async function createNotice(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return runAction(async () => admin.createNotice(await requireUser('admin'), noticeSchema.parse(formObject(fd))), {
    revalidate: ['/dashboard', '/'],
    message: 'Notice published',
  });
}
