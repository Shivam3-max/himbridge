'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { FormMessage } from '@/components/ui/primitives';
import { useT } from '@/i18n/client';
import { authClient } from '@/lib/auth-client';

export function ForgotPasswordForm() {
  const t = useT();
  const [state, setState] = useState<{ ok: boolean; error?: string; message?: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = String(new FormData(form).get('email') ?? '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setState({ ok: false, error: t('Enter a valid email address.') });
    setPending(true);
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: '/reset-password' });
    setPending(false);
    if (error && error.status !== 404) return setState({ ok: false, error: t(error.message || 'Something went wrong. Please try again.') });
    // Same answer whether or not the account exists.
    setState({ ok: true, message: t('If an account exists for this email, a reset link is on its way.') });
    form.reset();
  }

  return (
    <form className="block" onSubmit={onSubmit} noValidate>
      <div className="block-head saffron">
        <h3>{t('Request a reset link')}</h3>
      </div>
      <div className="block-body">
        <FormMessage state={state} />
        <div className="field">
          <label htmlFor="email">
            {t('Registered email')} <span className="req">*</span>
          </label>
          <input id="email" name="email" type="email" autoComplete="username" required />
        </div>
        <button className="btn" disabled={pending} aria-busy={pending}>
          {pending ? t('Please wait…') : t('Send reset link')}
        </button>
        <span className="small muted" style={{ marginInlineStart: 10 }}>
          <Link href="/login">{t('Back to login')}</Link>
        </span>
        <p className="tiny muted" style={{ marginTop: 14 }}>
          {t("The link is valid for 1 hour. If you don't see the email, check your spam folder or contact the help desk.")}
        </p>
      </div>
    </form>
  );
}
