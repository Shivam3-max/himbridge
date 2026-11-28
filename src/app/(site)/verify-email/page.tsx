import type { Metadata } from 'next';
import Link from 'next/link';
import { Block, PageBar } from '@/components/ui/primitives';
import { getI18n } from '@/i18n/server';

export const metadata: Metadata = { title: 'Email verification' };

/**
 * Landing page after the verification link. Better Auth verifies the token at /api/auth/verify-email
 * and redirects here — with `?error=…` when the link is invalid or expired.
 */
export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { t } = await getI18n();
  const failed = typeof (await searchParams).error === 'string';
  return (
    <>
      <PageBar crumbs={[[null, 'Email verification']]} title="Email Verification" />
      <div className="wrap section" style={{ maxWidth: 560 }}>
        <Block title={t('Confirming your email')} tone="green">
          {failed ? (
            <>
              <div className="form-msg show err">{t('This link is invalid or has expired. Please request a new one.')}</div>
              <p className="small">
                {t('Log in and use')} <b>{t('Resend verification email')}</b> {t('on your dashboard to get a fresh link.')}
              </p>
              <Link className="btn ghost" href="/login">
                {t('Login')}
              </Link>
            </>
          ) : (
            <>
              <div className="form-msg show ok">{t('Thank you — your email address is confirmed.')}</div>
              <Link className="btn" href="/dashboard">
                {t('Open my dashboard')}
              </Link>
            </>
          )}
        </Block>
      </div>
    </>
  );
}
