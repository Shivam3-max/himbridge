import 'server-only';
import { desc, eq, inArray } from 'drizzle-orm';
import type { z } from 'zod';
import {
  READINESS_ITEMS,
  readinessItemsFor,
  readinessScore,
  serviceByKey,
  type ReadinessStatus,
  type ServiceStatus,
} from '@/domain/export-readiness';
import { sectorOf } from '@/domain/sectors';
import type { complianceSchema, serviceRequestSchema } from '@/lib/validation';
import { requireVendorProfile, type CurrentUser } from '../auth/session';
import { db } from '../db/client';
import { serviceRequest, user, vendorCompliance, vendorProfile } from '../db/schema';
import { AppError, forbidden, notFound } from '../errors';
import { sendMail } from '../mail';

/** The vendor's export readiness checklist (items for their sector, with saved status) and score. */
export async function getChecklist(viewer: CurrentUser) {
  const v = requireVendorProfile(viewer);
  const items = readinessItemsFor(sectorOf(v.vendor.niche));
  const saved = await db.select().from(vendorCompliance).where(eq(vendorCompliance.vendorId, v.id));
  const byKey = new Map(saved.map((s) => [s.itemKey, s]));
  const rows = items.map((i) => ({
    ...i,
    status: (byKey.get(i.key)?.status ?? 'missing') as ReadinessStatus,
    reference: byKey.get(i.key)?.reference ?? '',
    expiresOn: byKey.get(i.key)?.expiresOn ?? null,
  }));
  return { rows, ...readinessScore(items, Object.fromEntries(rows.map((r) => [r.key, r.status]))) };
}

export async function updateChecklistItem(viewer: CurrentUser, key: string, input: z.infer<typeof complianceSchema>) {
  const v = requireVendorProfile(viewer);
  if (!READINESS_ITEMS.some((i) => i.key === key)) throw notFound('Checklist item');
  await db
    .insert(vendorCompliance)
    .values({ vendorId: v.id, itemKey: key, ...input })
    .onConflictDoUpdate({ target: [vendorCompliance.vendorId, vendorCompliance.itemKey], set: input });
}

/** Admin overview: readiness score of every vendor. */
export async function listVendorReadiness(viewer: CurrentUser) {
  if (viewer.role !== 'admin') throw forbidden();
  const vendors = await db
    .select({ id: user.id, company: user.company, niche: vendorProfile.niche, verification: vendorProfile.verification })
    .from(vendorProfile)
    .innerJoin(user, eq(user.id, vendorProfile.userId));
  const saved = vendors.length
    ? await db
        .select()
        .from(vendorCompliance)
        .where(
          inArray(
            vendorCompliance.vendorId,
            vendors.map((v) => v.id),
          ),
        )
    : [];
  return vendors
    .map((v) => {
      const status = Object.fromEntries(saved.filter((s) => s.vendorId === v.id).map((s) => [s.itemKey, s.status]));
      return { ...v, ...readinessScore(readinessItemsFor(sectorOf(v.niche)), status) };
    })
    .sort((a, b) => a.score - b.score);
}

// ── Service requests ─────────────────────────────────────────

export async function createServiceRequest(viewer: CurrentUser, input: z.infer<typeof serviceRequestSchema>) {
  const svc = serviceByKey(input.service)!;
  const audience = viewer.role === 'vendor' ? 'vendor' : viewer.role === 'buyer' ? 'buyer' : null;
  if (!audience || svc.for !== audience) throw new AppError('This service is not available for your account type', 403);
  await db.insert(serviceRequest).values({ userId: viewer.id, ...input });
  const admins = await db.select({ email: user.email }).from(user).where(eq(user.role, 'admin'));
  await Promise.all(
    admins.map((a) =>
      sendMail(
        a.email,
        `Service request: ${svc.name}`,
        `${viewer.company} (${viewer.email}) asked for ${svc.name}.\n\n${input.note}`,
      ).catch(() => undefined),
    ),
  );
}

export async function listServiceRequests(viewer: CurrentUser) {
  return db
    .select({
      id: serviceRequest.id,
      service: serviceRequest.service,
      note: serviceRequest.note,
      status: serviceRequest.status,
      createdAt: serviceRequest.createdAt,
      company: user.company,
      email: user.email,
      role: user.role,
    })
    .from(serviceRequest)
    .innerJoin(user, eq(user.id, serviceRequest.userId))
    .where(viewer.role === 'admin' ? undefined : eq(serviceRequest.userId, viewer.id))
    .orderBy(desc(serviceRequest.id));
}
export type ServiceRequestRow = Awaited<ReturnType<typeof listServiceRequests>>[number];

export async function setServiceStatus(viewer: CurrentUser, id: number, status: ServiceStatus) {
  if (viewer.role !== 'admin') throw forbidden();
  const [row] = await db.update(serviceRequest).set({ status }).where(eq(serviceRequest.id, id)).returning({ id: serviceRequest.id });
  if (!row) throw notFound('Service request');
}
