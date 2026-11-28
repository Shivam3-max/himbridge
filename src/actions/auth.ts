'use server';

import { randomInt } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { cookies, headers } from 'next/headers';
import { isLocale, LOCALE_COOKIE } from '@/i18n/config';
import { registerSchema } from '@/lib/validation';
import { formFiles, formObject, runAction, type ActionResult } from '@/server/action';
import { auth } from '@/server/auth/auth';
import type { CurrentUser } from '@/server/auth/session';
import { db } from '@/server/db/client';
import { user, vendorProfile } from '@/server/db/schema';
import { AppError } from '@/server/errors';
import { uploadFiles } from '@/server/services/files';
import { ORIGIN_COUNTRY } from '@/domain/sectors';
import { isBuyerType } from '@/domain/sourcing';
import { requireUser } from '@/server/auth/session';

/** A strong, easy-to-type password like "HB-7KQ4-X92R-MPT3" (no look-alike characters). */
function generatePassword() {
  const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const group = () => Array.from({ length: 4 }, () => abc[randomInt(abc.length)]).join('');
  return `HB-${group()}-${group()}-${group()}`;
}

/**
 * Creates an account and signs the person in straight away. Their login ID is their email; if they left the
 * password blank, one is generated and returned so the page can show it once. Sign-up is only possible through this action (the raw HTTP endpoint is disabled),
 * so the account type is always validated and vendors always get a profile.
 */
export async function register(
  _prev: ActionResult<{ email: string; password?: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ email: string; password?: string }>> {
  return runAction(async () => {
    const input = registerSchema.parse(formObject(formData));
    const existing = await db.query.user.findFirst({ where: eq(user.email, input.email), columns: { id: true } });
    if (existing) throw new AppError('An account with this email already exists', 409);
    const generated = input.password ? undefined : generatePassword();

    const res = await auth.api.signUpEmail({
      body: {
        name: input.name,
        email: input.email,
        password: input.password ?? generated!,
        role: input.role,
        company: input.company,
        country: input.role === 'vendor' ? ORIGIN_COUNTRY : input.country,
        phone: input.phone,
        buyerType: input.role === 'buyer' ? (input.buyerType ?? 'importer') : '',
        buyerNote: input.role === 'buyer' && input.buyerType === 'other' ? input.buyerNote : '',
        callbackURL: '/verify-email',
      },
      headers: await headers(),
    });
    const userId = res.user.id;

    if (input.role === 'vendor') {
      try {
        await db.insert(vendorProfile).values({
          userId,
          niche: input.niche!,
          cluster: input.cluster,
          certifications: input.certifications,
          capacity: input.capacity,
          years: input.years,
          about: input.about,
        });
      } catch (err) {
        await db.delete(user).where(eq(user.id, userId)); // keep sign-up all-or-nothing
        throw err;
      }
      const kyc = formFiles(formData, 'kyc');
      if (kyc.length) {
        // The new session cookie is not part of this request yet, so act as the new vendor directly.
        const vendor: CurrentUser = {
          id: userId,
          role: 'vendor',
          name: input.name,
          email: input.email,
          emailVerified: false,
          company: input.company,
          country: input.role === 'vendor' ? ORIGIN_COUNTRY : input.country,
          phone: input.phone,
          buyerType: '',
          buyerNote: '',
          vendor: null,
        };
        // KYC upload failures must not undo a successful registration; documents can be added later.
        await uploadFiles(vendor, { kind: 'kyc', refId: null, label: 'KYC document' }, kyc).catch((e) =>
          console.warn('[register] KYC upload skipped:', e),
        );
      }
    }
    return { email: input.email, password: generated };
  });
}

/** Remembers the chosen language in a cookie (read on the server, so pages render translated). */
export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
}

/** Buyers can switch their buyer type (brand / designer / importer); it tailors their dashboard. */
export async function setBuyerType(type: string): Promise<ActionResult> {
  return runAction(
    async () => {
      const me = await requireUser('buyer');
      if (!isBuyerType(type)) throw new AppError('Unknown buyer type');
      await db.update(user).set({ buyerType: type }).where(eq(user.id, me.id));
    },
    { revalidate: ['/dashboard'], message: 'Saved' },
  );
}
