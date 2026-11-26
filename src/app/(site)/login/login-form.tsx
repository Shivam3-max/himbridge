'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Block, FormMessage } from '@/components/ui/primitives';
import { useT } from '@/i18n/client';
import { authClient } from '@/lib/auth-client';

/** Demo accounts created by `npm run db:seed` (development / staging only). */
const DEMO: [label: string, email: string][] = [
  ['Admin (Himbridge team)', 'admin@himbridge.trade'],
  ['Buyer — USA', 'buyer@himbridge.trade'],
  ['Buyer — UAE', 'omar@gulfliving.ae'],
  ['Vendor — Handicrafts', 'vendor.in@himbridge.trade'],
  ['Vendor — Spices', 'spices@himbridge.trade'],
  ['Vendor — pending KYC', 'kerala@himbridge.trade'],
  ['Logistics partner', 'logistics@himbridge.trade'],
];
const DEMO_PASSWORD = 'Himbridge@123';

export function LoginForm({ next, children }: { next: string; children: ReactNode }) {
  const t = useT();
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signIn(email: string, password: string) {
    if (!email || !password) return setError(t('Enter your email and password.'));
    setPending(true);
    setError(null);
    const { error: err } = await authClient.signIn.email({ email, password });
    if (err) {
      setPending(false);
      setError(t(err.status === 401 ? 'Incorrect email or password' : err.message || 'Something went wrong. Please try again.'));
      return;
    }
    router.push(next);
    router.refresh();
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    void signIn(String(fd.get('email') ?? '').trim(), String(fd.get('password') ?? ''));
  };

  const fillDemo = (email: string) => {
    const f = form.current;
    if (!f) return;
    (f.elements.namedItem('email') as HTMLInputElement).value = email;
    (f.elements.namedItem('password') as HTMLInputElement).value = DEMO_PASSWORD;
    void signIn(email, DEMO_PASSWORD);
  };

  return (
    <div className="auth">
      <Block title={t('Sign in to your account')} tone="saffron" bodyClassName="">
        <form ref={form} className="block-body" onSubmit={onSubmit} noValidate>
          <FormMessage state={error ? { ok: false, error } : null} />
          <div className="field">
            <label htmlFor="email">
              {t('Registered email')} <span className="req">*</span>
            </label>
            <input id="email" name="email" type="email" autoComplete="username" required />
          </div>
          <div className="field">
            <label htmlFor="password">
              {t('Password')} <span className="req">*</span>
            </label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn" disabled={pending} aria-busy={pending}>
              {pending ? t('Please wait…') : t('Login')}
            </button>
            <span className="small">
              <Link href="/forgot-password">{t('Forgot password?')}</Link>
            </span>
          </div>
          <p className="small muted" style={{ marginTop: 16 }}>
            {t('New to Himbridge?')}{' '}
            <Link href="/register">
              <b>{t('Create an account')}</b>
            </Link>
          </p>
        </form>
      </Block>
      <div className="grid" style={{ alignContent: 'start' }}>
        <Block
          title={t('Demo accounts')}
          tone="green"
          right={
            <span className="tiny muted">
              {t('Password')}: <b>{DEMO_PASSWORD}</b>
            </span>
          }
        >
          <table className="demo-list">
            <tbody>
              {DEMO.map(([label, email]) => (
                <tr key={email}>
                  <td>
                    <b>{t(label)}</b>
                    <br />
                    <span className="tiny muted">{email}</span>
                  </td>
                  <td className="right">
                    <button type="button" className="btn sm ghost" disabled={pending} onClick={() => fillDemo(email)}>
                      {t('Use')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Block>
        {children}
      </div>
    </div>
  );
}
