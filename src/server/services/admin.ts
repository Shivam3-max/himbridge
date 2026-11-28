import 'server-only';
import { desc, eq } from 'drizzle-orm';
import type { z } from 'zod';
import type { VendorStatus } from '@/domain/roles';
import type { noticeSchema } from '@/lib/validation';
import type { CurrentUser } from '../auth/session';
import { db } from '../db/client';
import { emailOutbox, notice, user, vendorProfile } from '../db/schema';
import { forbidden, notFound } from '../errors';

const assertAdmin = (viewer: CurrentUser) => {
  if (viewer.role !== 'admin') throw forbidden();
};

export async function listNotices(limit = 20) {
  return db.select().from(notice).orderBy(desc(notice.createdAt), desc(notice.id)).limit(limit);
}

export async function createNotice(viewer: CurrentUser, input: z.infer<typeof noticeSchema>) {
  assertAdmin(viewer);
  await db.insert(notice).values(input);
}

export async function listUsers(viewer: CurrentUser) {
  assertAdmin(viewer);
  return db
    .select({
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      company: user.company,
      country: user.country,
      status: user.status,
      buyerType: user.buyerType,
      buyerNote: user.buyerNote,
      createdAt: user.createdAt,
      niche: vendorProfile.niche,
      cluster: vendorProfile.cluster,
      certifications: vendorProfile.certifications,
      capacity: vendorProfile.capacity,
      verification: vendorProfile.verification,
    })
    .from(user)
    .leftJoin(vendorProfile, eq(vendorProfile.userId, user.id))
    .orderBy(desc(user.createdAt));
}
export type AdminUserRow = Awaited<ReturnType<typeof listUsers>>[number];

export async function setVendorStatus(viewer: CurrentUser, vendorId: string, status: VendorStatus) {
  assertAdmin(viewer);
  const updated = await db.update(vendorProfile).set({ verification: status }).where(eq(vendorProfile.userId, vendorId)).returning();
  if (!updated.length) throw notFound('Vendor');
}

export async function listOutbox(viewer: CurrentUser) {
  assertAdmin(viewer);
  return db.select().from(emailOutbox).orderBy(desc(emailOutbox.id)).limit(100);
}
