import Link from 'next/link';
import { OrdersTable } from '@/components/dashboard/orders';
import { VerifyEmailBanner } from '@/components/dashboard/verify-banner';
import { Banner, Block, Kpis } from '@/components/ui/primitives';
import { getI18n } from '@/i18n/server';
import { usd } from '@/lib/format';
import { requirePageUser, type CurrentUser } from '@/server/auth/session';
import { getStats, listMyProducts } from '@/server/services/catalog';
import { listUsers } from '@/server/services/admin';
import { listOrders } from '@/server/services/orders';
import { listRfqInbox, listRfqsWithQuotes } from '@/server/services/rfqs';
import { getChecklist, listServiceRequests } from '@/server/services/readiness';
import { listRequests, listVendorRequests, sourcingStats } from '@/server/services/sourcing';
import {
  BUYER_TYPE_INFO,
  DEFAULT_KIND,
  isBuyerType,
  OPEN_STAGES,
  REQUEST_KIND_INFO,
  REQUEST_KINDS,
  type RequestKind,
} from '@/domain/sourcing';

export default async function DashboardOverview({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const me = await requirePageUser('/dashboard');
  const { welcome } = await searchParams;
  return (
    <>
      {me.role !== 'admin' && <VerifyEmailBanner email={me.email} verified={me.emailVerified} />}
      {me.role === 'buyer' && <BuyerOverview me={me} welcome={!!welcome} />}
      {me.role === 'vendor' && <VendorOverview me={me} />}
      {me.role === 'logistics' && <LogisticsOverview me={me} />}
      {me.role === 'admin' && <AdminOverview me={me} />}
    </>
  );
}

async function BuyerOverview({ me, welcome }: { me: CurrentUser; welcome: boolean }) {
  const [{ t }, rfqs, orders, projects] = await Promise.all([getI18n(), listRfqsWithQuotes(me), listOrders(me), listRequests(me)]);
  const type = isBuyerType(me.buyerType) ? me.buyerType : 'brand';
  const first = DEFAULT_KIND[type];
  const kinds: RequestKind[] = [first, ...REQUEST_KINDS.filter((k) => k !== first)];
  const openProjects = projects.filter((p) => OPEN_STAGES.includes(p.stage));
  const offersToReview = openProjects.reduce((n, p) => n + p.offers.filter((o) => o.status === 'submitted').length, 0);

  // "Next steps": the few things that need this buyer's attention, most urgent first.
  const todo: [href: string, text: string][] = [];
  for (const o of orders)
    for (const p of o.payments)
      if (p.status === 'due' && (p.stage === 'advance' || o.status === 'qc_passed'))
        todo.push([
          '/dashboard/orders',
          `${t('Pay the')} ${p.stage === 'advance' ? t('advance') : t('balance')} ${t('for')} ${o.code} (${usd(p.amount, 0)})`,
        ]);
  for (const p of openProjects) {
    const n = p.offers.filter((o) => o.status === 'submitted').length;
    if (n) todo.push([`/dashboard/sourcing/${p.id}`, `${t('Compare')} ${n} ${n === 1 ? t('offer') : t('offers')} — ${p.title}`]);
    if (p.stage === 'sampling') todo.push([`/dashboard/sourcing/${p.id}`, `${t('Approve samples, then place the order')} — ${p.title}`]);
  }
  for (const r of rfqs)
    if (r.status === 'open' && r.quotes.length) todo.push(['/dashboard/rfqs', `${t('Review quotes on RFQ')} #${r.id} — ${r.title}`]);

  return (
    <>
      {welcome && (
        <Banner tone="ok">
          {t('Welcome to Himbridge! Your buyer account is active.')}{' '}
          {t('Tell us what you want to source and we will match you with verified Indian manufacturers.')}
        </Banner>
      )}
      <Kpis
        items={[
          ['Active sourcing projects', openProjects.length, 'var(--saffron)'],
          ['Offers to review', offersToReview, '#1d4f91'],
          ['Active orders', orders.filter((o) => o.status !== 'delivered').length, 'var(--green)'],
          [
            'Total order value',
            usd(
              orders.reduce((s, o) => s + o.total, 0),
              0,
            ),
            'var(--red)',
          ],
        ]}
      />
      <Block title={t('Next steps')} tone="saffron">
        {todo.length ? (
          <ul className="todo">
            {todo.slice(0, 6).map(([href, text]) => (
              <li key={text}>
                <Link href={href}>{text} →</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="small muted" style={{ margin: 0 }}>
            {t('Nothing needs your attention right now.')} {projects.length === 0 && t('Start your first sourcing request below.')}
          </p>
        )}
      </Block>
      <h3 className="h-sm">{t('What would you like to do?')}</h3>
      <div className="quick-cards four">
        {kinds.map((k) => (
          <Link key={k} className="quick-card" href={`/dashboard/sourcing/new?kind=${k}`}>
            <span className="kind-ic" aria-hidden="true">
              {REQUEST_KIND_INFO[k].icon}
            </span>
            <b>{t(REQUEST_KIND_INFO[k].label)}</b>
            <span>{t(REQUEST_KIND_INFO[k].sub)}</span>
          </Link>
        ))}
        <Link className="quick-card" href="/dashboard/rfqs/new">
          <span className="kind-ic" aria-hidden="true">
            ⛴
          </span>
          <b>{t('Bulk / container order')}</b>
          <span>{t('Post an RFQ and compare quotes from verified exporters within 48 hours.')}</span>
        </Link>
      </div>
      <p className="tiny muted" style={{ marginTop: -6 }}>
        {t('Your account is set up as')} <b>{t(BUYER_TYPE_INFO[type].label)}</b>. <Link href="/dashboard/profile">{t('Change')}</Link>
      </p>
      <Block title={t('Recent orders')}>
        <OrdersTable orders={orders.slice(0, 5)} viewerRole="buyer" />
      </Block>
    </>
  );
}

async function VendorOverview({ me }: { me: CurrentUser }) {
  const [{ t }, products, rfqs, orders, requests, readiness] = await Promise.all([
    getI18n(),
    listMyProducts(me),
    listRfqInbox(me),
    listOrders(me),
    listVendorRequests(me),
    getChecklist(me),
  ]);
  const status = me.vendor?.verification;
  return (
    <>
      {status === 'verified' ? (
        <Banner tone="ok">
          ✔ {t('Your company is')} <b>{t('verified')}</b>. {t('You can quote on buyer RFQs.')}
        </Banner>
      ) : status === 'pending' ? (
        <Banner tone="warn">
          <b>{t('Verification pending.')}</b>{' '}
          {t(
            'The Himbridge compliance team will review your KYC within 7 working days. You can add products now; they go live and you can quote once verified.',
          )}
        </Banner>
      ) : (
        <Banner tone="warn">
          <b>{t('Account suspended.')}</b> {t('Contact the help desk.')}
        </Banner>
      )}
      {!readiness.canShip && (
        <Banner tone="info">
          <b>{t(`Export readiness: ${readiness.score}%`)}</b> — {t('finish your export registrations so buyers can order from you.')}{' '}
          <Link href="/dashboard/readiness">{t('Open checklist →')}</Link>
        </Banner>
      )}
      <Kpis
        items={[
          ['New sourcing requests', requests.filter((r) => !r.offers.length).length, 'var(--saffron)'],
          ['Matching bulk RFQs', rfqs.filter((r) => !r.myQuote).length, '#1d4f91'],
          ['Offers & quotes sent', requests.filter((r) => r.offers.length).length + rfqs.filter((r) => r.myQuote).length, 'var(--green)'],
          ['Active orders', orders.filter((o) => o.status !== 'delivered').length, 'var(--red)'],
        ]}
      />
      <Kpis
        items={[
          ['Listed products', products.length],
          ['Export readiness', `${readiness.score}%`, readiness.canShip ? 'var(--green)' : 'var(--saffron)'],
          ['Samples requested', requests.filter((r) => r.offers[0]?.status === 'sample_requested').length],
          ['Delivered orders', orders.filter((o) => o.status === 'delivered').length],
        ]}
      />
      <div className="row-actions">
        <Link className="btn saffron" href="/dashboard/sourcing">
          {t('Quote on sourcing requests')}
        </Link>
        <Link className="btn ghost" href="/dashboard/inbox">
          {t('Open RFQ inbox')}
        </Link>
        <Link className="btn ghost" href="/dashboard/products">
          {t('Add product')}
        </Link>
      </div>
      <Block title={t('Recent orders')}>
        <OrdersTable orders={orders.slice(0, 5)} viewerRole="vendor" />
      </Block>
    </>
  );
}

async function LogisticsOverview({ me }: { me: CurrentUser }) {
  const [{ t }, orders] = await Promise.all([getI18n(), listOrders(me)]);
  return (
    <>
      <Kpis
        items={[
          ['Assigned shipments', orders.length, 'var(--saffron)'],
          ['Awaiting pickup', orders.filter((o) => ['confirmed', 'in_production', 'qc_passed'].includes(o.status)).length],
          ['In transit', orders.filter((o) => ['shipped', 'customs'].includes(o.status)).length, 'var(--blue)'],
          ['Delivered', orders.filter((o) => o.status === 'delivered').length, 'var(--green)'],
        ]}
      />
      <Block title={t('Assigned shipments')}>
        <OrdersTable orders={orders} viewerRole="logistics" />
      </Block>
    </>
  );
}

async function AdminOverview({ me }: { me: CurrentUser }) {
  const [{ t }, s, users, orders, src, services] = await Promise.all([
    getI18n(),
    getStats(),
    listUsers(me),
    listOrders(me),
    sourcingStats(),
    listServiceRequests(me),
  ]);
  const newServices = services.filter((x) => x.status === 'new').length;
  const pending = users.filter((u) => u.role === 'vendor' && u.verification === 'pending').length;
  const toConfirm = orders.flatMap((o) => o.payments).filter((p) => p.status === 'submitted').length;
  return (
    <>
      {pending > 0 && (
        <Banner tone="warn">
          <b>{t(`${pending} vendor${pending > 1 ? 's' : ''}`)}</b> {t('awaiting verification.')}{' '}
          <Link href="/dashboard/admin/vendors">{t('Review now →')}</Link>
        </Banner>
      )}
      <Kpis
        items={[
          ['Verified vendors', s.vendors, 'var(--saffron)'],
          ['Buyers', s.buyers],
          ['Open RFQs', s.openRfqs, 'var(--red)'],
          ['Trade value', usd(s.tradeValue, 0), 'var(--green)'],
        ]}
      />
      <Kpis
        items={[
          ['Artisan clusters', s.clusters, 'var(--saffron)'],
          ['Product categories', s.niches, '#1d4f91'],
          ['Live SKUs', s.products],
          ['Payments to confirm', toConfirm, 'var(--red)'],
        ]}
      />
      <Kpis
        items={[
          ['New sourcing requests', src.submitted ?? 0, 'var(--saffron)'],
          ['Matching in progress', src.matching ?? 0],
          ['Offers / sampling', (src.offers ?? 0) + (src.sampling ?? 0), '#1d4f91'],
          ['New service requests', newServices, 'var(--red)'],
        ]}
      />
      {(src.submitted ?? 0) > 0 && (
        <Banner tone="warn">
          <b>{t(`${src.submitted} new sourcing requests`)}</b> {t('need matching.')}{' '}
          <Link href="/dashboard/sourcing">{t('Open the sourcing desk →')}</Link>
        </Banner>
      )}
      <Block title={t('Latest orders')}>
        <OrdersTable orders={orders.slice(0, 6)} viewerRole="admin" />
      </Block>
    </>
  );
}
