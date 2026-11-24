import type { Metadata } from 'next';
import { PageBar } from '@/components/ui/primitives';
import { ResetPasswordForm } from './reset-form';

export const metadata: Metadata = { title: 'Reset password' };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const token = typeof sp.token === 'string' ? sp.token : '';
  const invalid = typeof sp.error === 'string';
  return (
    <>
      <PageBar
        crumbs={[
          ['/login', 'Login'],
          [null, 'Reset password'],
        ]}
        title="Choose a New Password"
        lead="For your security, all other sessions are signed out after the change."
      />
      <div className="wrap section" style={{ maxWidth: 560 }}>
        <ResetPasswordForm token={invalid ? '' : token} invalidLink={invalid} />
      </div>
    </>
  );
}
