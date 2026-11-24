import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, CollectionChip, PageBanner, PageBar, Placeholder } from '@/components/ui/primitives';
import { nicheName } from '@/domain/niches';
import { getI18n } from '@/i18n/server';
import { listVerifiedVendors } from '@/server/services/catalog';

export const metadata: Metadata = { title: 'Vendor Directory' };

export default async function VendorsPage() {
  const [{ t }, vendors] = await Promise.all([getI18n(), listVerifiedVendors()]);
  return (
    <>
      <PageBanner
        img="/images/banner-vendors.jpg"
        kicker="Verified vendors"
        line="Every maker visited, verified and on record."
        pos="60% 45%"
      />
      <PageBar
        crumbs={[[null, 'Vendor Directory']]}
        title="Verified Vendor Directory"
        lead="Every listed manufacturer has passed Himbridge's KYC and document verification. Factory audits are shown under certifications."
      />
      <div className="wrap section">
        <div className="banner info">
          {t('Are you a manufacturer, artisan workshop or exporter?')}{' '}
          <Link href="/register?role=vendor">
            <b>{t('Apply for verification →')}</b>
          </Link>{' '}
          {t('First 100 vendors get free Gold tier under the Founding Vendor Programme.')}
        </div>
        {vendors.length ? (
          <div className="grid g2">
            {vendors.map((v) => (
              <div key={v.id} className="block">
                <div className="block-body" style={{ display: 'flex', gap: 14 }}>
                  <Placeholder label="Logo" className="logo-ph" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0 }}>{v.company}</h3>
                      <Badge tone="ok">✔ {t('Verified')}</Badge>
                    </div>
                    <div className="small muted" style={{ margin: '4px 0 8px' }}>
                      <CollectionChip origin={v.origin} /> &nbsp;{v.cluster} · {t(nicheName(v.niche))}
                    </div>
                    <p className="small">{v.about}</p>
                    <div className="kv">
                      <span>
                        {t('Capacity')} <b>{v.capacity || '—'}</b>
                      </span>
                      <span>
                        {t('Experience')} <b>{v.years ? t(`${v.years} yrs`) : '—'}</b>
                      </span>
                      <span>
                        {t('Products')} <b>{v.productCount}</b>
                      </span>
                    </div>
                    <div className="kv" style={{ marginTop: 6 }}>
                      <span>
                        {t('Certifications')} <b>{v.certifications || '—'}</b>
                      </span>
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                      <Link className="btn sm ghost" href={`/marketplace?q=${encodeURIComponent(v.company)}`}>
                        {t('View products')}
                      </Link>
                      <Link className="btn sm" href={`/dashboard/rfqs/new?niche=${v.niche}`}>
                        {t('Request quote')}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">{t('No verified vendors yet.')}</div>
        )}
      </div>
    </>
  );
}
