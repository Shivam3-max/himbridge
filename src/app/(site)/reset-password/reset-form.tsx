'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useT } from '@/i18n/client';
import { authClient } from '@/lib/auth-client';

export function ResetPasswordForm({ token, invalidLink }: { token: string; invalidLink: boolean }) {
  const t = useT();
  const initialError = invalidLink
    ? 'This link is invalid or has expired. Please request a new one.'
    : !token
      ? 'This page needs the link from your reset email. Request a new one from "Forgot password".'
      : null;
  const [error, setError] = useState<string | null>(initialError ? t(initialError) : null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get('password') ?? '');
    if (password.length < 8) return setError(t('Password must be at least 8 characters.'));
    if (password !== fd.get('confirm')) return setError(t('The two passwords do not match.'));
    if (!token) return setError(t(initialError ?? 'This link is invalid or has expired. Please request a new one.'));
    setPending(true);
    const { error: err } = await authClient.resetPassword({ newPassword: password, token });
    setPending(false);
    if (err) return setError(t('This link is invalid or has expired. Please request a new one.'));
    setDone(true);
  }

  return (
    <form className="block" onSubmit={onSubmit} noValidate>
      <div className="block-head saffron">
        <h3>{t('New password')}</h3>
      </div>
      <div className="block-body">
        {done ? (
          <>
            <div className="form-msg show ok">{t('Password updated. You can now log in with your new password.')}</div>
            <Link className="btn" href="/login">
              {t('Go to login')}
            </Link>
          </>
        ) : (
          <>
            {error && (
              <div className="form-msg show err">
                {error} <Link href="/forgot-password">{t('Request a new link')}</Link>
              </div>
            )}
            <div className="field">
              <label htmlFor="pw">
                {t('New password')} <span className="req">*</span> <span className="tiny muted">{t('(min 8 characters)')}</span>
              </label>
              <input id="pw" name="password" type="password" autoComplete="new-password" minLength={8} required />
            </div>
            <div className="field">
              <label htmlFor="pw2">
                {t('Confirm new password')} <span className="req">*</span>
              </label>
              <input id="pw2" name="confirm" type="password" autoComplete="new-password" required />
            </div>
            <button className="btn" disabled={pending} aria-busy={pending}>
              {pending ? t('Please wait…') : t('Save password')}
            </button>
          </>
        )}
      </div>
    </form>
  );
}
