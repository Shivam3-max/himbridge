import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileList } from '@/components/dashboard/files';
import { EstimateCard } from '@/components/sourcing/wizard';
import {
  CloseRequestButton,
  MessageForm,
  OfferComparison,
  OfferForm,
  StageBadge,
  StageSelect,
  StageTrack,
} from '@/components/sourcing/sourcing-ui';
import { Badge, Banner, Block, Empty, SectorChip } from '@/components/ui/primitives';
import { nicheName } from '@/domain/niches';
import {
  BUYER_TYPE_INFO,
  DELIVERY_TERM_LABEL,
  isBuyerType,
  OFFER_STATUS_LABEL,
  OPEN_STAGES,
  orderTier,
  REORDER_LABEL,
  REQUEST_KIND_INFO,
  SHIPPING_PREF_LABEL,
  suggestShipMode,
  targetValue,
  type DeliveryTerm,
  type ReorderPlan,
  type ShippingPref,
} from '@/domain/sourcing';
import { getI18n } from '@/i18n/server';
import { fmtDate, usd } from '@/lib/format';
import { requirePageUser } from '@/server/auth/session';
import { AppError } from '@/server/errors';
import { getRequest, type SourcingDetail } from '@/server/services/sourcing';

export const metadata = { title: 'Sourcing project' };

export default async function SourcingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { id } = await params;
  const me = await requirePageUser(`/dashboard/sourcing/${id}`);
  const { t } = await getI18n();
  let r: SourcingDetail;
  try {
    r = await getRequest(me, Number(id));
  } catch (e) {
    if (e instanceof AppError) notFound();
    throw e;
  }
  const { new: isNew } = await searchParams;
  const open = OPEN_STAGES.includes(r.stage);
  const value = targetValue(r.items);
  const current = r.items.reduce((s, i) => s + (i.currentPrice ?? 0) * i.quantity, 0);
  const bestValue = r.offers[0]?.total ?? value;
  const flags = [
    r.samplesNeeded && t('Samples first'),
    r.privateLabel && t('Private label'),
    r.customPackaging && t('Custom packaging'),
  ].filter(Boolean) as string[];

  return (
    <>
      <div className="crumbs small" style={{ marginBottom: 8 }}>
        <Link href="/dashboard/sourcing">← {me.role === 'vendor' ? t('Sourcing requests') : t('Sourcing projects')}</Link>
      </div>
      {isNew && (
        <Banner tone="ok">
          ✔{' '}
          {t(
            'Request sent. Our sourcing desk will review it within one working day and invite matching manufacturers. Offers will appear on this page.',
          )}
        </Banner>
      )}
      {r.orderCode && (
        <Banner tone="ok">
          {t('Production order')} <b>{r.orderCode}</b> {t('was placed from this request.')}{' '}
          <Link href="/dashboard/orders">{t('Track the order →')}</Link>
        </Banner>
      )}

      <Block
        title={
          <>
            {r.title} <span className="tiny muted">· {r.code}</span>
          </>
        }
        tone="saffron"
        right={me.role === 'admin' ? <StageSelect requestId={r.id} stage={r.stage} /> : <StageBadge stage={r.stage} />}
      >
        <StageTrack stage={r.stage} />
        <div className="kv" style={{ margin: '12px 0' }}>
          <span>
            {t('Type')} <b>{t(REQUEST_KIND_INFO[r.kind].label)}</b>
          </span>
          <span>
            {t('Category')} <b>{t(nicheName(r.niche))}</b> <SectorChip niche={r.niche} />
          </span>
          <span>
            {t('Deliver to')} <b>{r.destination}</b>
          </span>
          <span>
            {t('Needed by')} <b>{r.deliverBy ? fmtDate(r.deliverBy) : t('Flexible')}</b>
          </span>
          <span>
            {t('Shipping')} <b>{t(SHIPPING_PREF_LABEL[r.shipping as ShippingPref] ?? r.shipping)}</b>
          </span>
          <span>
            {t('Terms')} <b>{t(DELIVERY_TERM_LABEL[r.terms as DeliveryTerm] ?? r.terms)}</b>
          </span>
          <span>
            {t('Reorder')} <b>{t(REORDER_LABEL[r.reorder as ReorderPlan] ?? r.reorder)}</b>
          </span>
          {me.role !== 'vendor' ? (
            <span>
              {t('Buyer')} <b>{r.buyerCompany}</b> ({r.buyerCountry})
            </span>
          ) : (
            <span>
              {t('Buyer')} <b>{isBuyerType(r.buyerType) ? t(BUYER_TYPE_INFO[r.buyerType].label) : t('Buyer')}</b> ({r.buyerCountry})
            </span>
          )}
        </div>
        {flags.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            {flags.map((f) => (
              <Badge key={f} tone="info">
                {f}
              </Badge>
            ))}
          </div>
        )}
        {r.brief && <p className="small">{r.brief}</p>}
        {r.storeUrl && me.role !== 'vendor' && (
          <p className="small">
            {t('Store / website')}:{' '}
            <a href={r.storeUrl} target="_blank" rel="noopener noreferrer nofollow">
              {r.storeUrl}
            </a>
          </p>
        )}
        <FileList files={r.attachments} />
        {me.role === 'buyer' && open && (
          <div style={{ marginTop: 10 }}>
            <CloseRequestButton requestId={r.id} />
          </div>
        )}
      </Block>

      {me.role === 'vendor' ? (
        <VendorPanel r={r} t={t} />
      ) : (
        <>
          <EstimateCard
            valueLabel={r.offers.length ? t('Best offer value') : t('Target order value')}
            value={bestValue}
            currentValue={current}
            tier={orderTier(bestValue)}
            mode={suggestShipMode(bestValue, r.shipping as ShippingPref)}
          />
          <Block title={t('Items & offers')} bodyClassName="block-body">
            {r.offers.length ? (
              <OfferComparison items={r.items} offers={r.offers} open={open && me.role === 'buyer'} />
            ) : (
              <>
                <ItemsTable r={r} t={t} />
                <Empty style={{ marginTop: 12 }}>
                  {r.stage === 'closed'
                    ? t('This request is closed.')
                    : t('No offers yet. Matched manufacturers usually reply within 3–5 working days.')}
                </Empty>
              </>
            )}
          </Block>
          <Block title={t('Messages with the Himbridge sourcing desk')}>
            {r.messages.length ? (
              <ul className="thread">
                {r.messages.map((m) => (
                  <li key={m.id} className={m.authorRole === 'admin' ? 'desk' : 'me'}>
                    <div className="tiny muted">
                      {m.authorRole === 'admin' ? t('Himbridge sourcing desk') : (m.authorName ?? '')} · {fmtDate(m.createdAt)}
                    </div>
                    <p>{m.body}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="small muted">
                {t('Questions about makers, samples or shipping? Ask here and we reply within one working day.')}
              </p>
            )}
            <MessageForm requestId={r.id} />
          </Block>
        </>
      )}
    </>
  );
}

function ItemsTable({ r, t }: { r: SourcingDetail; t: (s: string) => string }) {
  return (
    <div className="table-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>{t('Item')}</th>
            <th className="right">{t('Qty')}</th>
            <th className="right">{t('You pay now')}</th>
            <th className="right">{t('Your target')}</th>
            <th className="right">{t('Your selling price')}</th>
          </tr>
        </thead>
        <tbody>
          {r.items.map((i) => (
            <tr key={i.id}>
              <td>
                <b>{i.name}</b>
                {i.spec && <div className="tiny muted">{i.spec}</div>}
                {i.referenceUrl && (
                  <a className="tiny" href={i.referenceUrl} target="_blank" rel="noopener noreferrer nofollow">
                    {t('Reference link ↗')}
                  </a>
                )}
              </td>
              <td className="right">
                {i.quantity} {i.unit}
              </td>
              <td className="right">{i.currentPrice ? usd(i.currentPrice) : '—'}</td>
              <td className="right">{i.targetPrice ? usd(i.targetPrice) : '—'}</td>
              <td className="right">{i.retailPrice ? usd(i.retailPrice) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VendorPanel({ r, t }: { r: SourcingDetail; t: (s: string) => string }) {
  const mine = r.offers[0] ?? null;
  const open = OPEN_STAGES.includes(r.stage);
  return (
    <>
      <Block title={t('Items requested')}>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>{t('Item')}</th>
                <th className="right">{t('Qty')}</th>
                <th className="right">{t('Buyer target')}</th>
              </tr>
            </thead>
            <tbody>
              {r.items.map((i) => (
                <tr key={i.id}>
                  <td>
                    <b>{i.name}</b>
                    {i.spec && <div className="tiny muted">{i.spec}</div>}
                    {i.referenceUrl && (
                      <a className="tiny" href={i.referenceUrl} target="_blank" rel="noopener noreferrer nofollow">
                        {t('Reference link ↗')}
                      </a>
                    )}
                  </td>
                  <td className="right">
                    {i.quantity} {i.unit}
                  </td>
                  <td className="right">{i.targetPrice ? usd(i.targetPrice) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Block>
      <Block
        title={mine ? t('Your offer') : t('Send your offer')}
        tone="green"
        right={mine ? <Badge tone="ok">{OFFER_STATUS_LABEL[mine.status]}</Badge> : undefined}
      >
        {mine?.status === 'sample_requested' && (
          <Banner tone="info">
            {t('The buyer asked for samples. The Himbridge desk will share the courier account and address with you.')}
          </Banner>
        )}
        {open && mine?.status !== 'accepted' ? (
          <OfferForm requestId={r.id} items={r.items} existing={mine} />
        ) : (
          <p className="small muted">
            {mine?.status === 'accepted' ? t('The buyer placed an order with you. See Orders.') : t('This request is closed.')}
          </p>
        )}
      </Block>
    </>
  );
}
