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
  const [{ t }, rfqs, orders] = await Promise.all([getI18n(), listRfqsWithQuotes(me), listOrders(me)]);
  return (
    <>
      {welcome && (
        <Banner tone="ok">
          {t('Welcome to Himbridge! Your buyer account is active. Post your first buying requirement to receive quotations.')}
        </Banner>
      )}
      <Kpis
        items={[
          ['Open RFQs', rfqs.filter((r) => r.status === 'open').length, 'var(--saffron)'],
          ['Quotes received', rfqs.reduce((n, r) => n + r.quotes.length, 0)],
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
      <div className="row-actions">
        <Link className="btn saffron" href="/dashboard/rfqs/new">
          {t('Post new RFQ')}
        </Link>
        <Link className="btn ghost" href="/marketplace">
          {t('Browse marketplace')}
        </Link>
        <Link className="btn ghost" href="/dashboard/orders">
          {t('Track orders')}
        </Link>
      </div>
      <Block title={t('Recent orders')}>
        <OrdersTable orders={orders.slice(0, 5)} viewerRole="buyer" />
      </Block>
    </>
  );
}

async function VendorOverview({ me }: { me: CurrentUser }) {
  const [{ t }, products, rfqs, orders] = await Promise.all([getI18n(), listMyProducts(me), listRfqInbox(me), listOrders(me)]);
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
      <Kpis
        items={[
          ['Listed products', products.length, 'var(--saffron)'],
          ['Matching open RFQs', rfqs.filter((r) => !r.myQuote).length],
          ['Quotes submitted', rfqs.filter((r) => r.myQuote).length, 'var(--green)'],
          ['Active orders', orders.filter((o) => o.status !== 'delivered').length, 'var(--red)'],
        ]}
      />
      <div className="row-actions">
        <Link className="btn saffron" href="/dashboard/inbox">
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
  const [{ t }, s, users, orders] = await Promise.all([getI18n(), getStats(), listUsers(me), listOrders(me)]);
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
          ['Crafted vendors', s.vendorsCrafted, 'var(--saffron)'],
          ['Engineered vendors', s.vendorsEngineered, '#1d4f91'],
          ['Live SKUs', s.products],
          ['Payments to confirm', toConfirm, 'var(--red)'],
        ]}
      />
      <Block title={t('Latest orders')}>
        <OrdersTable orders={orders.slice(0, 6)} viewerRole="admin" />
      </Block>
    </>
  );
}
