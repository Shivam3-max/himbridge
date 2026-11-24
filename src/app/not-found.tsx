import Link from 'next/link';
import { LogoMark } from '@/components/brand/logo';
import { BRAND } from '@/config/brand';
import { getI18n } from '@/i18n/server';

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <main id="main" className="wrap section error-page">
      <Link className="brand" href="/" style={{ justifyContent: 'center', marginBottom: 24 }}>
        <LogoMark />
        <div style={{ textAlign: 'start' }}>
          <div className="brand-name">{BRAND.name}</div>
          <div className="brand-tag">{t('Global Trade Portal')}</div>
        </div>
      </Link>
      <h1>{t('Page not found')}</h1>
      <p className="muted">{t('The page you requested does not exist or has moved.')}</p>
      <Link className="btn" href="/">
        {t('Go to home page')}
      </Link>
    </main>
  );
}
