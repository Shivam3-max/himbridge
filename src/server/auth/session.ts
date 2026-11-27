import 'server-only';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import type { Role } from '@/domain/roles';
import { db } from '../db/client';
import { user, vendorProfile } from '../db/schema';
import { AppError } from '../errors';
import { auth } from './auth';

export type VendorProfile = typeof vendorProfile.$inferSelect;

export interface CurrentUser {
  id: string;
  role: Role;
  name: string;
  email: string;
  emailVerified: boolean;
  company: string;
  country: string;
  phone: string;
  buyerType: string;
  vendor: VendorProfile | null;
}

/** The signed-in user for this request (fresh from the database), or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const row = await db.query.user.findFirst({ where: eq(user.id, session.user.id), with: { vendorProfile: true } });
  if (!row || row.status !== 'active') return null;
  return {
    id: row.id,
    role: row.role,
    name: row.name,
    email: row.email,
    emailVerified: row.emailVerified,
    company: row.company,
    country: row.country,
    phone: row.phone,
    buyerType: row.buyerType,
    vendor: row.vendorProfile ?? null,
  };
});

/** For server actions: the signed-in user, optionally limited to some roles. Throws AppError otherwise. */
export async function requireUser(...roles: Role[]): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) throw new AppError('Please log in', 401);
  if (roles.length && !roles.includes(u.role)) throw new AppError('Not allowed for your account type', 403);
  return u;
}

/** For pages: the signed-in user, or a redirect to the login page that comes back here afterwards. */
export async function requirePageUser(returnTo: string): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return u;
}

export type VendorUser = CurrentUser & { role: 'vendor'; vendor: VendorProfile };
export function requireVendorProfile(u: CurrentUser): VendorUser {
  if (u.role !== 'vendor' || !u.vendor) throw new AppError('Not allowed for your account type', 403);
  return u as VendorUser;
}
