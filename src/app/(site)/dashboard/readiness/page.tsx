import Link from 'next/link';
import { ChecklistForm } from '@/components/sourcing/sourcing-ui';
import { Badge, Banner, Block, Empty, SectorChip } from '@/components/ui/primitives';
import { READINESS_GROUPS, READINESS_STATUS_LABEL, type ReadinessItem } from '@/domain/export-readiness';
import { getI18n } from '@/i18n/server';
import { fmtDate } from '@/lib/format';
import { requirePageUser } from '@/server/auth/session';
import { getChecklist, listVendorReadiness } from '@/server/services/readiness';

export const metadata = { title: 'Export readiness' };

const tone = (s: string) => (s === 'done' ? 'ok' : s === 'in_progress' ? 'info' : s === 'na' ? 'grey' : 'warn');

export default async function ReadinessPage() {
  const me = await requirePageUser('/dashboard/readiness');
  const { t } = await getI18n();

  if (me.role === 'admin') {
    const rows = await listVendorReadiness(me);
    return (
      <Block title={t('Export readiness of manufacturers')} bodyClassName="">
        {rows.length ? (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('Manufacturer')}</th>
                  <th>{t('Sector')}</th>
                  <th>{t('Verification')}</th>
                  <th>{t('Readiness')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <b>{v.company}</b>
                    </td>
                    <td>
                      <SectorChip niche={v.niche} />
                    </td>
                    <td>
                      <Badge tone={v.verification === 'verified' ? 'ok' : 'warn'}>{v.verification}</Badge>
                    </td>
                    <td style={{ minWidth: 180 }}>
                      <div className="meter" style={{ '--v': `${v.score}%` } as React.CSSProperties}>
                        <i />
                      </div>
                      <span className="tiny muted">
                        {v.score}% · {t(`${v.done} of ${v.required} required items`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No manufacturers yet.</Empty>
        )}
      </Block>
    );
  }

  if (me.role !== 'vendor') return <Empty>The export readiness checklist is for manufacturer accounts.</Empty>;

  const c = await getChecklist(me);
  const groups = Object.keys(READINESS_GROUPS) as ReadinessItem['group'][];
  return (
    <>
      <div className="readiness-head block">
        <div className="score-ring" style={{ '--v': `${c.score * 3.6}deg` } as React.CSSProperties}>
          <b>{c.score}%</b>
          <span>{t('ready')}</span>
        </div>
        <div>
          <h2 className="h-sm">{t('Your export readiness')}</h2>
          <p className="small">
            {t(`${c.done} of ${c.required} required registrations done.`)}{' '}
            {c.canShip
              ? t('You have everything needed to ship your first export order.')
              : t('Finish the items below to receive export orders. Optional items help you win bigger buyers.')}
          </p>
          <div className="row-actions" style={{ margin: 0 }}>
            <Link className="btn saffron sm" href="/dashboard/services?s=export_start">
              {t('Let Himbridge file these for me')}
            </Link>
            <Link className="btn ghost sm" href="/export-ready">
              {t('How the programme works')}
            </Link>
          </div>
        </div>
      </div>
      {!c.canShip && (
        <Banner tone="info">{t('Tip: start with IEC, GST LUT and AD code. They take under a week and unlock everything else.')}</Banner>
      )}
      {groups.map((g) => {
        const rows = c.rows.filter((r) => r.group === g);
        if (!rows.length) return null;
        return (
          <Block key={g} title={t(READINESS_GROUPS[g])} bodyClassName="">
            <ul className="checklist">
              {rows.map((r) => (
                <li key={r.key} className={r.status}>
                  <div className="cl-head">
                    <div>
                      <b>{t(r.name)}</b> {r.optional && <span className="tiny muted">({t('optional')})</span>}
                      <p className="small muted">{t(r.what)}</p>
                    </div>
                    <Badge tone={tone(r.status)}>{READINESS_STATUS_LABEL[r.status]}</Badge>
                  </div>
                  <details>
                    <summary className="small">{t('How to apply')}</summary>
                    <dl className="cl-facts">
                      <dt>{t('Apply at')}</dt>
                      <dd>
                        {r.url ? (
                          <a href={r.url} target="_blank" rel="noopener noreferrer">
                            {t(r.applyAt)} ↗
                          </a>
                        ) : (
                          t(r.applyAt)
                        )}
                      </dd>
                      <dt>{t('Government fee')}</dt>
                      <dd>{t(r.fee)}</dd>
                      <dt>{t('Time')}</dt>
                      <dd>{t(r.time)}</dd>
                      <dt>{t('Validity')}</dt>
                      <dd>{t(r.validity)}</dd>
                      <dt>{t('Who helps')}</dt>
                      <dd>{t(r.who)}</dd>
                    </dl>
                  </details>
                  <ChecklistForm itemKey={r.key} status={r.status} reference={r.reference} expiresOn={r.expiresOn} />
                  {r.expiresOn && (
                    <div className="tiny muted">
                      {t('Renews on')} {fmtDate(r.expiresOn)}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Block>
        );
      })}
      <p className="tiny muted">
        {t('Fees and timelines are indicative (2026). Items marked "verify" had conflicting sources; confirm with your CA.')}
      </p>
    </>
  );
}
