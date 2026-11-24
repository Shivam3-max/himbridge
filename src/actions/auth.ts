'use server';

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

/**
 * Creates an account. Sign-up is only possible through this action (the raw HTTP endpoint is disabled),
 * so the account type is always validated and vendors always get a profile.
 */
export async function register(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const input = registerSchema.parse(formObject(formData));
    const existing = await db.query.user.findFirst({ where: eq(user.email, input.email), columns: { id: true } });
    if (existing) throw new AppError('An account with this email already exists', 409);

    const res = await auth.api.signUpEmail({
      body: {
        name: input.name,
        email: input.email,
        password: input.password,
        role: input.role,
        company: input.company,
        country: input.country,
        phone: input.phone,
        callbackURL: '/verify-email',
      },
      headers: await headers(),
    });
    const userId = res.user.id;

    if (input.role === 'vendor') {
      try {
        await db.insert(vendorProfile).values({
          userId,
          origin: input.origin as 'IN' | 'CN',
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
          country: input.country,
          phone: input.phone,
          vendor: null,
        };
        // KYC upload failures must not undo a successful registration; documents can be added later.
        await uploadFiles(vendor, { kind: 'kyc', refId: null, label: 'KYC document' }, kyc).catch((e) =>
          console.warn('[register] KYC upload skipped:', e),
        );
      }
    }
  });
}

/** Remembers the chosen language in a cookie (read on the server, so pages render translated). */
export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
}
