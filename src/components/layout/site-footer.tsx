import Link from 'next/link';
import { BRAND } from '@/config/brand';
import { getI18n } from '@/i18n/server';
import { LogoMark } from '../brand/logo';

const COLUMNS: [title: string, links: [href: string, label: string][]][] = [
  [
    'For Buyers',
    [
      ['/marketplace', 'Browse marketplace'],
      ['/dashboard/rfqs/new', 'Post an RFQ'],
      ['/track', 'Track shipment'],
      ['/tools#landed', 'Landed cost calculator'],
      ['/register?role=buyer', 'Buyer registration'],
    ],
  ],
  [
    'For Vendors',
    [
      ['/register?role=vendor', 'Vendor registration'],
      ['/niches', 'Niche opportunities'],
      ['/tools#docs', 'Export documents'],
      ['/about#verification', 'Verification process'],
      ['/about#programme', 'Founding Vendor Programme'],
    ],
  ],
  [
    'Partners',
    [
      ['/register?role=logistics', 'Logistics partner sign-up'],
      ['/about#ecosystem', 'Ecosystem'],
      ['/tools#incoterms', 'Incoterms guide'],
      ['/tools#hs', 'HS code finder'],
    ],
  ],
  [
    'Portal',
    [
      ['/about', 'About Himbridge'],
      ['/about#revenue', 'Business model'],
      ['/login', 'Login'],
      ['/about#policies', 'Terms & privacy'],
    ],
  ],
];

export async function SiteFooter() {
  const { t } = await getI18n();
  return (
    <footer className="footer">
      <div className="wrap footer-cols">
        <div>
          <Link className="brand" href="/">
            <LogoMark />
            <div>
              <div className="brand-name" style={{ fontSize: '1.35rem' }}>
                {BRAND.name}
              </div>
              <div className="brand-tag">{t('Global Trade Portal')}</div>
            </div>
          </Link>
          <p className="small muted" style={{ marginTop: 12 }}>
            {t('One trusted desk for verified manufacturers, quality inspection, export documentation and door-to-door logistics.')}
          </p>
          <p className="small">
            <b>{t('Help desk')}:</b> {BRAND.helpline}
            <br />
            <b>{t('Email')}:</b> {BRAND.email}
            <br />
            <span className="muted">{t(BRAND.hours)}</span>
          </p>
        </div>
        {COLUMNS.map(([title, links]) => (
          <div key={title}>
            <h4>{t(title)}</h4>
            <ul>
              {links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href}>{t(label)}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <div className="wrap">
          <span>
            © {new Date().getFullYear()} {BRAND.full}. {t('All rights reserved.')}
          </span>
          <span>{t('Best viewed in latest Chrome, Safari, Edge')}</span>
        </div>
      </div>
    </footer>
  );
}
