import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND } from '@/config/brand';
import { CollectionChip, PageBanner, PageBar, StatusBadge, Timeline } from '@/components/ui/primitives';
import { getI18n } from '@/i18n/server';
import { fmtDate } from '@/lib/format';
import { trackOrder } from '@/server/services/orders';

export const metadata: Metadata = { title: 'Track Shipment' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function TrackPage({ searchParams }: { searchParams: SearchParams }) {
  const raw = (await searchParams).code;
  const code = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 40) ?? '';
  const [{ t }, result] = await Promise.all([getI18n(), code ? trackOrder(code) : Promise.resolve(null)]);

  return (
    <>
      <PageBanner img="/images/banner-track.jpg" kicker="Shipment tracking" line="Know where your order is. Always." />
      <PageBar
        crumbs={[[null, 'Track Shipment']]}
        title="Track Your Shipment"
        lead="Enter the Himbridge order / tracking number shared on your order confirmation (format HBG-YYYY-NNNN)."
      />
      <div className="wrap section split">
        <div>
          <div className="block">
            <div className="block-head saffron">
              <h3>{t('Tracking enquiry')}</h3>
            </div>
            <form className="block-body" action="/track" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                name="code"
                defaultValue={code}
                placeholder={t('e.g. HBG-2026-0001')}
                required
                style={{ flex: 1, minWidth: 200 }}
                aria-label={t('Tracking number')}
              />
              <button className="btn">{t('Track')}</button>
            </form>
          </div>
          <div style={{ marginTop: 16 }} aria-live="polite">
            {code && !result && <div className="banner warn">{t('No shipment found for this tracking number')}</div>}
            {result && (
              <div className="block">
                <div className="block-head">
                  <h3>{result.code}</h3>
                  <StatusBadge status={result.status} />
                </div>
                <div className="block-body">
                  <p>
                    <b>{result.title}</b>
                  </p>
                  <div className="kv" style={{ marginBottom: 14 }}>
                    <span>
                      {t('Collection')} <CollectionChip origin={result.vendorOrigin} />
                    </span>
                    <span>
                      {t('Destination')} <b>{result.destination}</b>
                    </span>
                    <span>
                      {t('Incoterm')} <b>{result.incoterm}</b>
                    </span>
                    <span>
                      {t('Mode')} <b>{result.mode || t('To be assigned')}</b>
                    </span>
                    <span>
                      {t('Route')}{' '}
                      <b>
                        {result.originPort || '—'} → {result.destPort || '—'}
                      </b>
                    </span>
                    <span>
                      {t('Booked')} <b>{t(fmtDate(result.createdAt))}</b>
                    </span>
                  </div>
                  <Timeline status={result.status} milestones={result.milestones} />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="block">
          <div className="block-head green">
            <h3>{t('Need help?')}</h3>
          </div>
          <div className="block-body small">
            <p>
              {t('Try the demo tracking number')}{' '}
              <Link href="/track?code=HBG-2026-0001">
                <b>HBG-2026-0001</b>
              </Link>
              .
            </p>
            <p>
              {t('For detailed documents (invoice, packing list, bill of lading),')} <Link href="/login">{t('log in')}</Link>{' '}
              {t('to your buyer dashboard.')}
            </p>
            <p>
              <b>{t('Help desk')}:</b> {BRAND.helpline}
              <br />
              <b>{t('Email')}:</b> {BRAND.email}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
