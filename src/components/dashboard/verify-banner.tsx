'use client';

import { useState } from 'react';
import { useT } from '@/i18n/client';
import { authClient } from '@/lib/auth-client';
import { useToast } from '../ui/toast';

/** Reminder to confirm the email address, with a "resend" button. */
export function VerifyEmailBanner({ email, verified }: { email: string; verified: boolean }) {
  const t = useT();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (verified) return null;
  return (
    <div className="banner warn">
      <b>{t('Please confirm your email address.')}</b> {t('We sent a link to')} {email}.{' '}
      <button
        className="btn sm ghost"
        style={{ marginInlineStart: 6 }}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const { error } = await authClient.sendVerificationEmail({ email, callbackURL: '/verify-email' });
          setBusy(false);
          if (error) toast(t(error.message ?? 'Something went wrong. Please try again.'), true);
          else toast(t('Verification email sent'));
        }}
      >
        {t('Resend verification email')}
      </button>
    </div>
  );
}
