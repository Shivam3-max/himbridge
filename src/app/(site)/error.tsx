'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useT } from '@/i18n/client';

/** Shown when a page fails unexpectedly. Details go to the server log, never to the visitor. */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="wrap section error-page">
      <h1>{t('Something went wrong')}</h1>
      <p className="muted">{t('Something went wrong. Please try again.')}</p>
      {error.digest && <p className="tiny muted">Ref: {error.digest}</p>}
      <div className="row-actions" style={{ justifyContent: 'center' }}>
        <button type="button" className="btn" onClick={reset}>
          {t('Try again')}
        </button>
        <Link className="btn ghost" href="/">
          {t('Go to home page')}
        </Link>
      </div>
    </div>
  );
}
