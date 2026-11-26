import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FileList } from '@/components/dashboard/files';
import { AcceptQuoteButton } from '@/components/dashboard/trade-forms';
import { Badge, Block, SectorChip, Empty } from '@/components/ui/primitives';
import { nicheName } from '@/domain/niches';
import { getI18n } from '@/i18n/server';
import { fmtDate, fmtNum, usd } from '@/lib/format';
import { requirePageUser } from '@/server/auth/session';
import { listRfqsWithQuotes, type RfqWithQuotes } from '@/server/services/rfqs';

export const metadata = { title: 'RFQs' };

export default async function RfqsPage() {
  const me = await requirePageUser('/dashboard/rfqs');
  if (me.role === 'vendor') redirect('/dashboard/inbox');
  if (me.role === 'logistics') redirect('/dashboard');
  const [{ t }, rfqs] = await Promise.all([getI18n(), listRfqsWithQuotes(me)]);
  if (me.role === 'admin') return <AdminRfqTable rfqs={rfqs} t={t} />;
  if (!rfqs.length)
    return (
      <Empty>
        {t('You have not posted any RFQs yet.')} <Link href="/dashboard/rfqs/new">{t('Post your first RFQ →')}</Link>
      </Empty>
    );
  return rfqs.map((r) => (
    <div key={r.id} className="rfq-card">
      <header>
        <div>
          <b>
            RFQ #{r.id} — {r.title}
          </b>
          <div className="tiny muted">
            {t(nicheName(r.niche))} · {t(`posted ${fmtDate(r.createdAt)}`)}
          </div>
        </div>
        <Badge tone={r.status === 'open' ? 'warn' : 'ok'}>{r.status}</Badge>
      </header>
      <div className="body">
        <div className="kv" style={{ marginBottom: 10 }}>
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
            {t('Target')} <b>{r.targetPrice ? usd(r.targetPrice) : '—'}</b>
          </span>
          <span>
            {t('Sector')} <SectorChip niche={r.niche} />
          </span>
        </div>
        {r.details && <p className="small">{r.details}</p>}
        <FileList files={r.attachments} />
        {r.quotes.length ? (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('Vendor')}</th>
                  <th>{t('Sector')}</th>
                  <th className="right">{t('Unit price')}</th>
                  <th className="right">{t('Order value')}</th>
                  <th>{t('Lead time')}</th>
                  <th>{t('Note')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {r.quotes.map((q) => (
                  <tr key={q.id}>
                    <td>
                      <b>{q.vendorCompany}</b>
                      <br />
                      <span className="tiny muted">{q.certifications}</span>
                    </td>
                    <td>
                      <SectorChip niche={q.vendorNiche} />
                    </td>
                    <td className="right">{usd(q.unitPrice)}</td>
                    <td className="right">{usd(q.unitPrice * r.quantity, 0)}</td>
                    <td>{t(`${q.leadDays} days`)}</td>
                    <td className="small">{q.note}</td>
                    <td>
                      {r.status === 'open' ? (
                        <AcceptQuoteButton quoteId={q.id} />
                      ) : (
                        <Badge tone={q.status === 'accepted' ? 'ok' : 'grey'}>{q.status}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="small muted">{t('Awaiting quotations from matched vendors.')}</div>
        )}
      </div>
    </div>
  ));
}

function AdminRfqTable({ rfqs, t }: { rfqs: RfqWithQuotes[]; t: (s: string) => string }) {
  return (
    <Block title={t('All RFQs')} bodyClassName="">
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>#</th>
              <th>{t('Requirement')}</th>
              <th>{t('Buyer')}</th>
              <th>{t('Qty')}</th>
              <th>{t('Sector')}</th>
              <th>{t('Quotes')}</th>
              <th>{t('Status')}</th>
            </tr>
          </thead>
          <tbody>
            {rfqs.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>
                  <b>{r.title}</b>
                  <br />
                  <span className="tiny muted">
                    {t(nicheName(r.niche))} → {r.destination}
                  </span>
                </td>
                <td className="small">{r.buyerCompany}</td>
                <td>
                  {fmtNum(r.quantity)} {r.unit}
                </td>
                <td>
                  <SectorChip niche={r.niche} />
                </td>
                <td>
                  {r.quoteCount}
                  {r.quotes[0] && (
                    <>
                      <br />
                      <span className="tiny muted">{t(`best ${usd(r.quotes[0].unitPrice)}`)}</span>
                    </>
                  )}
                </td>
                <td>
                  <Badge tone={r.status === 'open' ? 'warn' : 'ok'}>{r.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Block>
  );
}
