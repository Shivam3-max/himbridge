import { redirect } from 'next/navigation';
import { FileList } from '@/components/dashboard/files';
import { QuoteForm } from '@/components/dashboard/trade-forms';
import { Badge, Banner, Empty } from '@/components/ui/primitives';
import { collectionName } from '@/domain/collections';
import { nicheName } from '@/domain/niches';
import { getI18n } from '@/i18n/server';
import { fmtDate, fmtNum, usd } from '@/lib/format';
import { requirePageUser } from '@/server/auth/session';
import { listRfqInbox } from '@/server/services/rfqs';

export const metadata = { title: 'RFQ Inbox' };

export default async function InboxPage() {
  const me = await requirePageUser('/dashboard/inbox');
  if (me.role !== 'vendor' || !me.vendor) redirect('/dashboard');
  const [{ t }, rfqs] = await Promise.all([getI18n(), listRfqInbox(me)]);
  const locked = me.vendor.verification !== 'verified';
  return (
    <>
      {locked ? (
        <Banner tone="warn">{t('Quoting unlocks once your company is verified. You can preview matching RFQs below.')}</Banner>
      ) : (
        <Banner tone="info">
          {t('Showing open RFQs for your collection:')} <b>{t(collectionName(me.vendor.origin))}</b> ·{' '}
          {t('Matches in your category are listed first:')} <b>{t(nicheName(me.vendor.niche))}</b>
        </Banner>
      )}
      {!rfqs.length && <Empty>No open RFQs right now. New buyer requirements appear here automatically.</Empty>}
      {rfqs.map((r) => (
        <div key={r.id} className="rfq-card">
          <header>
            <div>
              <b>
                RFQ #{r.id} — {r.title}
              </b>
              <div className="tiny muted">
                {t(nicheName(r.niche))} · {r.buyerCountry} {t('buyer')} · {t(`posted ${fmtDate(r.createdAt)}`)}
              </div>
            </div>
            {r.niche === me.vendor!.niche ? <Badge tone="ok">Your niche</Badge> : <Badge tone="grey">Other niche</Badge>}
          </header>
          <div className="body">
            <div className="kv" style={{ marginBottom: 8 }}>
              <span>
                {t('Qty')}{' '}
                <b>
                  {fmtNum(r.quantity)} {r.unit}
                </b>
              </span>
              <span>
                {t('Destination')} <b>{r.destination}</b>
              </span>
              <span>
                {t('Target')} <b>{r.targetPrice ? usd(r.targetPrice) : t('Open')}</b>
              </span>
              <span>
                {t('Quotes so far')} <b>{r.quoteCount}</b>
              </span>
            </div>
            {r.details && <p className="small">{r.details}</p>}
            <FileList files={r.attachments} />
            {r.myQuote && (
              <div className="banner ok" style={{ margin: '0 0 6px' }}>
                {t('Your quote:')} <b>{usd(r.myQuote.unitPrice)}</b> / {t(`${r.unit}, ${r.myQuote.leadDays} days lead time.`)}
              </div>
            )}
            {!locked && <QuoteForm rfqId={r.id} quantity={r.quantity} existing={r.myQuote} />}
          </div>
        </div>
      ))}
    </>
  );
}
