import Link from 'next/link';
import { BRAND } from '@/config/brand';
import { getI18n } from '@/i18n/server';
import { getCurrentUser } from '@/server/auth/session';
import { listNotices } from '@/server/services/admin';
import { LogoMark } from '../brand/logo';
import { FontSizeButtons, LanguageSelect, LogoutButton, MainNav } from './header-controls';

export interface NavItem {
  href: string;
  label: string;
  /** Dropdown entries: [href, label, one-line description]. */
  children?: [href: string, label: string, sub: string][];
}

export const NAV: NavItem[] = [
  { href: '/', label: 'Home' },
  {
    href: '/solutions/brands',
    label: 'Source from India',
    children: [
      ['/solutions/brands', 'E-commerce & D2C brands', 'Small batches, private label, samples first'],
      ['/solutions/designers', 'Architects & interior designers', 'Custom pieces for your projects'],
      ['/solutions/importers', 'Importers & distributors', 'Container orders, inspected and shipped'],
      ['/dashboard/sourcing/new', 'Start a sourcing request', 'Tell us what you need, get matched offers'],
    ],
  },
  {
    href: '/marketplace',
    label: 'Marketplace',
    children: [
      ['/marketplace', 'Browse products', 'Live catalogue from verified makers'],
      ['/niches', 'Sectors & research', '16 Indian export categories'],
      ['/vendors', 'Verified manufacturers', 'KYC-checked factories and workshops'],
      ['/dashboard/rfqs/new', 'Post a bulk RFQ', 'Quotes from several exporters in 48 hours'],
    ],
  },
  {
    href: '/export-ready',
    label: 'For Manufacturers',
    children: [
      ['/register?role=vendor', 'Sell worldwide', 'Register your factory or workshop'],
      ['/export-ready', 'Export Readiness Programme', 'Licences, compliance and training'],
      ['/tools#docs', 'Export documents', 'Checklist by sector'],
    ],
  },
  {
    href: '/tools',
    label: 'Tools',
    children: [
      ['/tools#landed', 'Landed cost calculator', 'Duty, freight and fees for your market'],
      ['/tools#hs', 'HS code finder', 'Classify Indian products'],
      ['/tools#incoterms', 'Incoterms guide', 'Who pays for what'],
      ['/track', 'Track shipment', 'Live order milestones'],
    ],
  },
  { href: '/about', label: 'About' },
];

export async function SiteHeader() {
  const [{ t }, me, notices] = await Promise.all([getI18n(), getCurrentUser(), listNotices(6)]);
  return (
    <header>
      <a className="skip" href="#main">
        {t('Skip to main content')}
      </a>
      <div className="util">
        <div className="wrap">
          <div className="util-l">
            <span>{t('Global Sourcing & Export Platform')}</span>
            <span className="sep" />
            <span>{t('Verified · Inspected · Delivered')}</span>
          </div>
          <div className="util-r">
            <FontSizeButtons />
            <span className="sep" />
            <LanguageSelect />
            <span className="sep" />
            <span>
              {t('Help desk')}: <b dir="ltr">{BRAND.helpline}</b>
            </span>
          </div>
        </div>
      </div>
      <div className="band" />
      <div className="brand-row">
        <div className="wrap">
          <Link className="brand" href="/">
            <LogoMark />
            <div>
              <div className="brand-name">{BRAND.name}</div>
              <div className="brand-tag">{t('Global Trade Portal')}</div>
              <div className="brand-sub">{t('Verified manufacturers · Delivered worldwide')}</div>
            </div>
          </Link>
          <div className="brand-tools">
            <form className="search" action="/marketplace" role="search">
              <input name="q" placeholder={t('Search products, vendors, HS codes…')} aria-label={t('Search')} />
              <button aria-label={t('Search')}>⌕</button>
            </form>
            <div className="brand-partners">
              <div className="seal">
                <b>KYC</b>
                {t('Verified')}
              </div>
              <div className="seal">
                <b>QC</b>
                {t('Inspected')}
              </div>
              <div className="seal">
                <b>{t('Door')}</b>
                {t('to Door')}
              </div>
            </div>
          </div>
        </div>
      </div>
      <MainNav items={NAV}>
        {me ? (
          <>
            <Link className="btn sm saffron" href="/dashboard">
              {t('My Dashboard')}
            </Link>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link className="btn sm ghost" href="/login">
              {t('Login')}
            </Link>
            <Link className="btn sm saffron" href="/register">
              {t('Register')}
            </Link>
          </>
        )}
      </MainNav>
      {notices.length > 0 && (
        <div className="ticker">
          <div className="wrap">
            <span className="ticker-label">{t("What's New")}</span>
            <div className="ticker-track">
              <div className="ticker-inner">
                {[...notices, ...notices].map((n, i) => (
                  <span key={`${n.id}-${i}`} aria-hidden={i >= notices.length}>
                    {n.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
