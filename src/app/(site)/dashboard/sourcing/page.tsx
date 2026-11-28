import Link from 'next/link';
import { StageBadge, StageSelect, StageTrack } from '@/components/sourcing/sourcing-ui';
import { CategoryBadge } from '@/components/catalog/category-icon';
import { Badge, Block, Empty, SectorChip } from '@/components/ui/primitives';
import { nicheName } from '@/domain/niches';
import {
  BUYER_TYPE_INFO,
  isBuyerType,
  OFFER_STATUS_LABEL,
  REQUEST_KIND_INFO,
  REQUEST_KINDS,
  savingsPct,
  targetValue,
} from '@/domain/sourcing';
import { getI18n } from '@/i18n/server';
import { fmtDate, usd } from '@/lib/format';
import { requirePageUser } from '@/server/auth/session';
import { listRequests, listVendorRequests } from '@/server/services/sourcing';

export const metadata = { title: 'Sourcing projects' };

export default async function SourcingPage() {
  const me = await requirePageUser('/dashboard/sourcing');
  const { t } = await getI18n();

  if (me.role === 'vendor') {
    const rows = await listVendorRequests(me);
    return (
      <Block title={t('Sourcing requests in your sector')} bodyClassName="">
        {rows.length ? (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('Request')}</th>
                  <th>{t('Buyer')}</th>
                  <th className="right">{t('Target value')}</th>
                  <th>{t('Needed by')}</th>
                  <th>{t('Your offer')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const mine = r.offers[0];
                  return (
                    <tr key={r.id}>
                      <td>
                        <b>{r.title}</b>
                        <div className="tiny muted">
                          {r.code} · {t(nicheName(r.niche))} · {t(`${r.items.length} items`)}
                          {r.privateLabel ? ` · ${t('private label')}` : ''}
                        </div>
                      </td>
                      <td className="small">
                        {isBuyerType(r.buyerType) ? t(BUYER_TYPE_INFO[r.buyerType].label) : t('Buyer')}
                        <br />
                        <span className="tiny muted">{r.buyerCountry}</span>
                      </td>
                      <td className="right">{targetValue(r.items) ? usd(targetValue(r.items), 0) : '—'}</td>
                      <td className="small">{r.deliverBy ? fmtDate(r.deliverBy) : t('Flexible')}</td>
                      <td>{mine ? <Badge tone="ok">{OFFER_STATUS_LABEL[mine.status]}</Badge> : <Badge tone="warn">Not sent</Badge>}</td>
                      <td>
                        <Link className="btn sm" href={`/dashboard/sourcing/${r.id}`}>
                          {mine ? t('View offer') : t('View & quote')}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No open sourcing requests in your sector right now. New requests appear here and by email.</Empty>
        )}
      </Block>
    );
  }

  if (me.role === 'logistics') return <Empty>Sourcing requests are handled by buyers, manufacturers and the Himbridge desk.</Empty>;

  const rows = await listRequests(me);

  if (me.role === 'admin') {
    return (
      <Block title={t('Sourcing desk — all requests')} bodyClassName="">
        {rows.length ? (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('Request')}</th>
                  <th>{t('Buyer')}</th>
                  <th className="right">{t('Target value')}</th>
                  <th>{t('Offers')}</th>
                  <th>{t('Stage')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <b>{r.title}</b>
                      <div className="tiny muted">
                        {r.code} · {t(REQUEST_KIND_INFO[r.kind].label)} · {fmtDate(r.createdAt)}
                      </div>
                    </td>
                    <td className="small">
                      {r.buyerCompany}
                      <br />
                      <span className="tiny muted">
                        {r.buyerCountry}
                        {isBuyerType(r.buyerType) ? ` · ${t(BUYER_TYPE_INFO[r.buyerType].label)}` : ''}
                      </span>
                    </td>
                    <td className="right">{targetValue(r.items) ? usd(targetValue(r.items), 0) : '—'}</td>
                    <td>
                      {r.offers.length}
                      {r.messageCount > 0 && <div className="tiny muted">{t(`${r.messageCount} messages`)}</div>}
                    </td>
                    <td>
                      <StageSelect requestId={r.id} stage={r.stage} />
                    </td>
                    <td>
                      <Link className="btn sm" href={`/dashboard/sourcing/${r.id}`}>
                        {t('Open')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No sourcing requests yet.</Empty>
        )}
      </Block>
    );
  }

  // Buyer
  return (
    <>
      <div className="section-head">
        <div>
          <h2 className="h-sm">{t('Your sourcing projects')}</h2>
          <p className="small muted">{t('Everything you are sourcing from India: offers, samples and orders in one place.')}</p>
        </div>
        <Link className="btn saffron" href="/dashboard/sourcing/new">
          + {t('New sourcing request')}
        </Link>
      </div>
      {rows.length === 0 && (
        <div className="quick-cards">
          {REQUEST_KINDS.map((k) => (
            <Link key={k} className="quick-card" href={`/dashboard/sourcing/new?kind=${k}`}>
              <span className="kind-ic" aria-hidden="true">
                {REQUEST_KIND_INFO[k].icon}
              </span>
              <b>{t(REQUEST_KIND_INFO[k].label)}</b>
              <span>{t(REQUEST_KIND_INFO[k].sub)}</span>
            </Link>
          ))}
        </div>
      )}
      {rows.map((r) => {
        const best = r.offers[0];
        const current = r.items.reduce((s, i) => s + (i.currentPrice ?? 0) * i.quantity, 0);
        const save = best ? savingsPct(current, best.total) : null;
        return (
          <Link key={r.id} href={`/dashboard/sourcing/${r.id}`} className="project-card">
            <div className="project-main">
              <CategoryBadge niche={r.niche} size={42} />
              <div style={{ flex: 1 }}>
                <b>{r.title}</b>
                <div className="tiny muted">
                  {r.code} · {t(REQUEST_KIND_INFO[r.kind].label)} · {t(`${r.items.length} items`)} · {r.destination}
                </div>
              </div>
              <StageBadge stage={r.stage} />
            </div>
            <StageTrack stage={r.stage} compact />
            <div className="kv">
              <span>
                <SectorChip niche={r.niche} />
              </span>
              <span>
                {t('Offers')} <b>{r.offers.length}</b>
              </span>
              <span>
                {t('Best offer')} <b>{best ? usd(best.total, 0) : '—'}</b>
              </span>
              <span>
                {t('Your target')} <b>{targetValue(r.items) ? usd(targetValue(r.items), 0) : '—'}</b>
              </span>
              {save != null && (
                <span>
                  {t('Saving vs today')} <b className={save >= 0 ? 'up' : 'down'}>{save}%</b>
                </span>
              )}
              {r.messageCount > 0 && <span>✉ {r.messageCount}</span>}
            </div>
          </Link>
        );
      })}
    </>
  );
}
