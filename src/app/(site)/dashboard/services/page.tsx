import { ServiceRequestForm, ServiceStatusSelect } from '@/components/sourcing/sourcing-ui';
import { Badge, Block, Empty } from '@/components/ui/primitives';
import { SERVICE_STATUS_LABEL, SERVICES, serviceByKey, type ServiceStatus } from '@/domain/export-readiness';
import { ROLE_LABEL } from '@/domain/roles';
import { getI18n } from '@/i18n/server';
import { fmtDate } from '@/lib/format';
import { requirePageUser } from '@/server/auth/session';
import { listServiceRequests } from '@/server/services/readiness';

export const metadata = { title: 'Services' };

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const me = await requirePageUser('/dashboard/services');
  const { t } = await getI18n();
  const rows = await listServiceRequests(me);
  const { s } = await searchParams;

  const table = (
    <Block title={me.role === 'admin' ? t('All service requests') : t('Your service requests')} bodyClassName="">
      {rows.length ? (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('Service')}</th>
                {me.role === 'admin' && <th>{t('Requested by')}</th>}
                <th>{t('Details')}</th>
                <th>{t('Date')}</th>
                <th>{t('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <b>{t(serviceByKey(r.service)?.name ?? r.service)}</b>
                  </td>
                  {me.role === 'admin' && (
                    <td className="small">
                      {r.company}
                      <br />
                      <span className="tiny muted">
                        {t(ROLE_LABEL[r.role])} · {r.email}
                      </span>
                    </td>
                  )}
                  <td className="small">{r.note || '—'}</td>
                  <td className="small nowrap">{fmtDate(r.createdAt)}</td>
                  <td>
                    {me.role === 'admin' ? (
                      <ServiceStatusSelect id={r.id} status={r.status} />
                    ) : (
                      <Badge tone={r.status === 'done' ? 'ok' : r.status === 'cancelled' ? 'grey' : 'info'}>
                        {SERVICE_STATUS_LABEL[r.status as ServiceStatus]}
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>No service requests yet.</Empty>
      )}
    </Block>
  );

  if (me.role === 'admin') return table;
  if (me.role === 'logistics') return <Empty>Services are available to buyers and manufacturers.</Empty>;

  const audience = me.role === 'vendor' ? 'vendor' : 'buyer';
  const offers = SERVICES.filter((x) => x.for === audience);
  return (
    <>
      <div className="section-head">
        <div>
          <h2 className="h-sm">{me.role === 'vendor' ? t('Export services for manufacturers') : t('Sourcing services')}</h2>
          <p className="small muted">
            {me.role === 'vendor'
              ? t('We file registrations, prepare documents and train your team, so you can focus on making.')
              : t('Extra help from our team in India, from samples to door-to-door delivery.')}
          </p>
        </div>
      </div>
      <div className="service-grid">
        {offers.map((o) => (
          <a key={o.key} className="service-card" href={`?s=${o.key}#request`}>
            <b>{t(o.name)}</b>
            <p className="small">{t(o.includes)}</p>
            <span className="price-tag">{t(o.price)}</span>
          </a>
        ))}
      </div>
      <Block title={t('Request a service')} tone="saffron" id="request">
        <ServiceRequestForm key={s ?? ''} services={offers} preselect={offers.some((o) => o.key === s) ? s : undefined} />
      </Block>
      {table}
    </>
  );
}
