import type { Metadata } from 'next';
import Link from 'next/link';
import { PageBanner, PageBar } from '@/components/ui/primitives';
import {
  PROGRAMME_MODULES,
  PROGRAMME_STEPS,
  READINESS_GROUPS,
  READINESS_ITEMS,
  SERVICES,
  type ReadinessItem,
} from '@/domain/export-readiness';
import { getI18n } from '@/i18n/server';

export const metadata: Metadata = {
  title: 'Export Readiness Programme',
  description: 'Registrations, compliance, documents and training for Indian manufacturers who want to start exporting.',
};

export default async function ExportReadyPage() {
  const { t } = await getI18n();
  const groups = Object.keys(READINESS_GROUPS) as ReadinessItem['group'][];
  return (
    <>
      <PageBar
        crumbs={[
          [null, 'For manufacturers'],
          [null, 'Export Readiness Programme'],
        ]}
        title="Export Readiness Programme"
        lead="Great products, no export experience? We set up every registration, train your team and ship your first order with you."
      />
      <PageBanner img="/images/gallery-factory.jpg" kicker="For Indian manufacturers" line="From workshop to worldwide." />
      <div className="wrap section">
        <div className="cta-strip">
          <div>
            <b>{t('Join as a manufacturer')}</b>
            <span className="small muted">{t('Free registration · founding vendors get training and the compliance calendar free')}</span>
          </div>
          <Link className="btn saffron" href="/register?role=vendor">
            {t('Register your factory')} →
          </Link>
        </div>

        <h2 className="section-title">{t('How the programme works')}</h2>
        <div className="steps">
          {PROGRAMME_STEPS.map(([title, text]) => (
            <div key={title} className="step">
              <b>{t(title)}</b>
              <p>{t(text)}</p>
            </div>
          ))}
        </div>

        <h2 className="section-title">{t('Packages')}</h2>
        <div className="service-grid">
          {SERVICES.filter((s) => s.for === 'vendor').map((s) => (
            <div key={s.key} className="service-card">
              <b>{t(s.name)}</b>
              <p className="small">{t(s.includes)}</p>
              <span className="price-tag">{t(s.price)}</span>
            </div>
          ))}
        </div>

        <h2 className="section-title">{t('Every registration you need, in one checklist')}</h2>
        <p className="small muted">
          {t(
            'Your dashboard tracks each item, its renewal date and who is handling it. Sector items appear only if they apply to what you make.',
          )}
        </p>
        {groups.map((g) => (
          <div key={g} className="block" style={{ marginBottom: 14 }}>
            <div className="block-head">
              <h3>{t(READINESS_GROUPS[g])}</h3>
            </div>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>{t('Item')}</th>
                    <th>{t('Apply at')}</th>
                    <th>{t('Government fee')}</th>
                    <th>{t('Time')}</th>
                    <th>{t('Who helps')}</th>
                  </tr>
                </thead>
                <tbody>
                  {READINESS_ITEMS.filter((i) => i.group === g).map((i) => (
                    <tr key={i.key}>
                      <td>
                        <b>{t(i.name)}</b>
                        <div className="tiny muted">{t(i.what)}</div>
                      </td>
                      <td className="small">{t(i.applyAt)}</td>
                      <td className="small">{t(i.fee)}</td>
                      <td className="small">{t(i.time)}</td>
                      <td className="small">{t(i.who)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <h2 className="section-title">{t('Training modules')}</h2>
        <ol className="module-list">
          {PROGRAMME_MODULES.map((m) => (
            <li key={m}>{t(m)}</li>
          ))}
        </ol>
        <p className="tiny muted">
          {t('Fees and timelines are indicative (2026). Items marked "verify" had conflicting sources; confirm with your CA.')}
        </p>
      </div>
    </>
  );
}
