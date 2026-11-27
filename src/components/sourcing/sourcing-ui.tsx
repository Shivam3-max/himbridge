'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  closeSourcingRequest,
  placeSourcingOrder,
  postSourcingMessage,
  requestSamples,
  requestService,
  setServiceStatus,
  setSourcingStage,
  submitOffer,
  updateChecklistItem,
} from '@/actions/sourcing';
import {
  READINESS_STATUS_LABEL,
  READINESS_STATUSES,
  SERVICE_STATUS_LABEL,
  SERVICE_STATUSES,
  type ServiceOffer,
} from '@/domain/export-readiness';
import {
  marginPct,
  OFFER_STATUS_LABEL,
  savingsPct,
  SOURCING_FLOW,
  SOURCING_STAGES,
  stageIndex,
  stageLabel,
  type OfferStatus,
} from '@/domain/sourcing';
import { useT } from '@/i18n/client';
import { cx, fmtDate, usd } from '@/lib/format';
import { SubmitButton, useCommand, useFormAction } from '../ui/forms';
import { Badge, FormMessage } from '../ui/primitives';
import { useToast } from '../ui/toast';

// ── Stage tracker ────────────────────────────────────────────

export function StageTrack({ stage, compact = false }: { stage: string; compact?: boolean }) {
  const t = useT();
  const idx = stageIndex(stage);
  if (stage === 'closed') return <Badge tone="grey">Closed</Badge>;
  return (
    <ol className={cx('stage-track', compact && 'compact')}>
      {SOURCING_FLOW.map((s, i) => (
        <li key={s.key} className={cx(i < idx && 'done', i === idx && 'on')}>
          <span className="dotc">{i < idx ? '✓' : i + 1}</span>
          {!compact && (
            <>
              <b>{t(s.label)}</b>
              <small>{t(s.who)}</small>
            </>
          )}
        </li>
      ))}
    </ol>
  );
}

export function StageBadge({ stage }: { stage: string }) {
  const tone = stage === 'ordered' ? 'ok' : stage === 'closed' ? 'grey' : stage === 'offers' || stage === 'sampling' ? 'info' : 'warn';
  return <Badge tone={tone}>{stageLabel(stage)}</Badge>;
}

// ── Buyer: offer comparison ──────────────────────────────────

interface ItemView {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  currentPrice: number | null;
  targetPrice: number | null;
  retailPrice: number | null;
}
interface OfferView {
  id: number;
  vendorCompany: string;
  cluster: string;
  certifications: string;
  years: number;
  moq: number;
  leadDays: number;
  samplePrice: number | null;
  sampleDays: number | null;
  note: string;
  status: OfferStatus;
  total: number;
  lines: { itemId: number; unitPrice: number }[];
}

const Pct = ({ v, good = 'up' }: { v: number | null; good?: 'up' | 'down' }) =>
  v == null ? <span className="muted">—</span> : <b className={(good === 'up' ? v >= 0 : v < 0) ? 'up' : 'down'}>{v > 0 ? `+${v}` : v}%</b>;

/** Side-by-side offers: one column per maker, one row per item, with savings and margins. */
export function OfferComparison({ items, offers, open }: { items: ItemView[]; offers: OfferView[]; open: boolean }) {
  const t = useT();
  const currentTotal = items.reduce((s, i) => s + (i.currentPrice ?? 0) * i.quantity, 0);
  const targetTotal = items.reduce((s, i) => s + (i.targetPrice ?? 0) * i.quantity, 0);
  const cheapest = offers.length ? Math.min(...offers.map((o) => o.total)) : 0;
  const fastest = offers.length ? Math.min(...offers.map((o) => o.leadDays)) : 0;
  return (
    <div className="table-wrap">
      <table className="tbl compare">
        <thead>
          <tr>
            <th>{t('Item')}</th>
            <th className="right">{t('You pay now')}</th>
            <th className="right">{t('Your target')}</th>
            {offers.map((o) => (
              <th key={o.id} className="right offer-col">
                <b>{o.vendorCompany}</b>
                <div className="tiny muted">{o.cluster}</div>
                <div className="offer-tags">
                  {o.total === cheapest && offers.length > 1 && <Badge tone="ok">Best price</Badge>}
                  {o.leadDays === fastest && offers.length > 1 && <Badge tone="info">Fastest</Badge>}
                  {o.status !== 'submitted' && (
                    <Badge tone={o.status === 'declined' ? 'grey' : 'warn'}>{OFFER_STATUS_LABEL[o.status]}</Badge>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>
                <b>{i.name}</b>
                <div className="tiny muted">
                  {i.quantity} {i.unit}
                  {i.retailPrice ? ` · ${t('sells at')} ${usd(i.retailPrice)}` : ''}
                </div>
              </td>
              <td className="right">{i.currentPrice ? usd(i.currentPrice) : '—'}</td>
              <td className="right">{i.targetPrice ? usd(i.targetPrice) : '—'}</td>
              {offers.map((o) => {
                const price = o.lines.find((l) => l.itemId === i.id)?.unitPrice ?? null;
                const save = savingsPct(i.currentPrice, price);
                const margin = marginPct(i.retailPrice, price);
                return (
                  <td key={o.id} className="right">
                    {price ? (
                      <>
                        <b>{usd(price)}</b>
                        <div className="tiny">
                          {save != null && (
                            <span>
                              {t('saves')} <Pct v={save} />{' '}
                            </span>
                          )}
                          {margin != null && (
                            <span>
                              {t('margin')} <Pct v={margin} />
                            </span>
                          )}
                          {i.targetPrice && !save && !margin && (
                            <span>
                              {t('vs target')} <Pct v={savingsPct(i.targetPrice, price)} />
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <span className="tiny muted">{t('not quoted')}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th>{t('Order total (ex-works India)')}</th>
            <th className="right">{currentTotal ? usd(currentTotal, 0) : '—'}</th>
            <th className="right">{targetTotal ? usd(targetTotal, 0) : '—'}</th>
            {offers.map((o) => (
              <th key={o.id} className="right">
                {usd(o.total, 0)}
                {currentTotal > 0 && (
                  <div className="tiny">
                    {t('saves')} <Pct v={savingsPct(currentTotal, o.total)} />
                  </div>
                )}
              </th>
            ))}
          </tr>
          <tr className="meta-row">
            <td colSpan={3} className="small muted">
              {t('Minimum order · production time · samples')}
            </td>
            {offers.map((o) => (
              <td key={o.id} className="right small">
                {t('MOQ')} {o.moq}
                <br />
                {t(`${o.leadDays} days`)}
                <br />
                {o.samplePrice
                  ? `${t('Sample')} ${usd(o.samplePrice)}${o.sampleDays ? ` · ${t(`${o.sampleDays} days`)}` : ''}`
                  : t('Sample on request')}
              </td>
            ))}
          </tr>
          <tr className="meta-row">
            <td colSpan={3} className="small muted">
              {t('Maker notes')}
            </td>
            {offers.map((o) => (
              <td key={o.id} className="small">
                {o.note || '—'}
                {o.certifications && <div className="tiny muted">{o.certifications}</div>}
              </td>
            ))}
          </tr>
          {open && (
            <tr className="meta-row">
              <td colSpan={3} />
              {offers.map((o) => (
                <td key={o.id} className="right">
                  <OfferActions offerId={o.id} status={o.status} />
                </td>
              ))}
            </tr>
          )}
        </tfoot>
      </table>
    </div>
  );
}

function OfferActions({ offerId, status }: { offerId: number; status: OfferStatus }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const cmd = useCommand();
  return (
    <div className="offer-actions">
      {status === 'submitted' && (
        <button
          className="btn sm ghost"
          disabled={cmd.busy}
          onClick={() => cmd.run(() => requestSamples(offerId), { onSuccess: () => router.refresh() })}
        >
          {t('Request samples')}
        </button>
      )}
      <button
        className="btn sm green"
        disabled={cmd.busy}
        onClick={() =>
          cmd.run(() => placeSourcingOrder(offerId), {
            confirm: 'Place a production order with this maker? Other offers will be declined and a payment schedule is created.',
            onSuccess: (code) => {
              toast(t(`Order ${code} created`));
              router.push('/dashboard/orders');
            },
          })
        }
      >
        {t('Place order')}
      </button>
    </div>
  );
}

export function CloseRequestButton({ requestId }: { requestId: number }) {
  const t = useT();
  const router = useRouter();
  const cmd = useCommand();
  return (
    <button
      className="btn sm ghost"
      disabled={cmd.busy}
      onClick={() =>
        cmd.run(() => closeSourcingRequest(requestId), {
          confirm: 'Close this request? Makers will no longer be able to send offers.',
          onSuccess: () => router.refresh(),
        })
      }
    >
      {t('Close request')}
    </button>
  );
}

export function StageSelect({ requestId, stage }: { requestId: number; stage: string }) {
  const t = useT();
  const router = useRouter();
  const cmd = useCommand();
  return (
    <select
      aria-label={t('Stage')}
      value={stage}
      disabled={cmd.busy || stage === 'ordered'}
      onChange={(e) => cmd.run(() => setSourcingStage(requestId, e.target.value), { onSuccess: () => router.refresh() })}
    >
      {SOURCING_STAGES.map((s) => (
        <option key={s} value={s} disabled={s === 'ordered'}>
          {t(stageLabel(s))}
        </option>
      ))}
    </select>
  );
}

// ── Messages ─────────────────────────────────────────────────

export function MessageForm({ requestId }: { requestId: number }) {
  const t = useT();
  const router = useRouter();
  const f = useFormAction(postSourcingMessage.bind(null, requestId), { toastErrors: true, onSuccess: () => router.refresh() });
  return (
    <form onSubmit={f.onSubmit} className="msg-form">
      <textarea name="body" rows={2} placeholder={t('Write to the Himbridge sourcing desk…')} />
      <SubmitButton pending={f.pending} className="btn sm">
        Send
      </SubmitButton>
    </form>
  );
}

// ── Vendor: itemised offer ───────────────────────────────────

export function OfferForm({
  requestId,
  items,
  existing,
}: {
  requestId: number;
  items: { id: number; name: string; quantity: number; unit: string; targetPrice: number | null }[];
  existing: Pick<OfferView, 'moq' | 'leadDays' | 'samplePrice' | 'sampleDays' | 'note' | 'lines'> | null;
}) {
  const t = useT();
  const router = useRouter();
  const [prices, setPrices] = useState<Record<number, string>>(
    Object.fromEntries(items.map((i) => [i.id, String(existing?.lines.find((l) => l.itemId === i.id)?.unitPrice ?? '')])),
  );
  const total = items.reduce((s, i) => s + (Number(prices[i.id]) || 0) * i.quantity, 0);
  const f = useFormAction(submitOffer.bind(null, requestId), { reset: false, onSuccess: () => router.refresh() });
  return (
    <form onSubmit={f.onSubmit} noValidate>
      <FormMessage state={f.state && !f.state.ok ? f.state : null} />
      <input
        type="hidden"
        name="prices"
        value={JSON.stringify(
          Object.entries(prices)
            .filter(([, v]) => v.trim() !== '')
            .map(([itemId, v]) => ({ itemId: Number(itemId), unitPrice: Number(v) })),
        )}
      />
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>{t('Item')}</th>
              <th className="right">{t('Qty')}</th>
              <th className="right">{t('Buyer target')}</th>
              <th className="right">{t('Your price (USD / unit, ex-works)')}</th>
              <th className="right">{t('Line total')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>{i.name}</td>
                <td className="right">
                  {i.quantity} {i.unit}
                </td>
                <td className="right">{i.targetPrice ? usd(i.targetPrice) : '—'}</td>
                <td className="right">
                  <input
                    className="price-in"
                    type="number"
                    step="0.01"
                    min="0"
                    aria-label={`${t('Price')} ${i.name}`}
                    value={prices[i.id] ?? ''}
                    onChange={(e) => setPrices((p) => ({ ...p, [i.id]: e.target.value }))}
                  />
                </td>
                <td className="right">{prices[i.id] ? usd((Number(prices[i.id]) || 0) * i.quantity, 0) : '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={4}>{t('Offer total')}</th>
              <th className="right">{usd(total, 0)}</th>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="grid-form three" style={{ marginTop: 12 }}>
        <div className="field">
          <label>{t('Minimum order (units)')}</label>
          <input name="moq" type="number" min="1" defaultValue={existing?.moq ?? ''} />
        </div>
        <div className="field">
          <label>{t('Production time (days)')}</label>
          <input name="leadDays" type="number" min="1" defaultValue={existing?.leadDays ?? ''} />
        </div>
        <div className="field">
          <label>{t('Sample price (USD, total)')}</label>
          <input name="samplePrice" type="number" step="0.01" min="0" defaultValue={existing?.samplePrice ?? ''} />
        </div>
        <div className="field">
          <label>{t('Sample time (days)')}</label>
          <input name="sampleDays" type="number" min="1" defaultValue={existing?.sampleDays ?? ''} />
        </div>
        <div className="field full">
          <label>{t('Note to buyer')}</label>
          <textarea
            name="note"
            defaultValue={existing?.note ?? ''}
            placeholder={t('Materials, finishes, packaging, certifications, price breaks at higher quantities…')}
          />
        </div>
      </div>
      <SubmitButton pending={f.pending} className="btn green">
        {existing ? t('Update offer') : t('Send offer')}
      </SubmitButton>
    </form>
  );
}

// ── Vendor: readiness checklist row ──────────────────────────

export function ChecklistForm({
  itemKey,
  status,
  reference,
  expiresOn,
}: {
  itemKey: string;
  status: string;
  reference: string;
  expiresOn: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const f = useFormAction(updateChecklistItem.bind(null, itemKey), { reset: false, toastErrors: true, onSuccess: () => router.refresh() });
  return (
    <form onSubmit={f.onSubmit} className="check-form">
      <select name="status" defaultValue={status} aria-label={t('Status')}>
        {READINESS_STATUSES.map((s) => (
          <option key={s} value={s}>
            {t(READINESS_STATUS_LABEL[s])}
          </option>
        ))}
      </select>
      <input name="reference" defaultValue={reference} placeholder={t('Number / reference')} aria-label={t('Number / reference')} />
      <input name="expiresOn" type="date" defaultValue={expiresOn ?? ''} aria-label={t('Renewal date')} title={t('Renewal date')} />
      <SubmitButton pending={f.pending} className="btn sm">
        Save
      </SubmitButton>
    </form>
  );
}

// ── Services ─────────────────────────────────────────────────

export function ServiceRequestForm({ services, preselect }: { services: ServiceOffer[]; preselect?: string }) {
  const t = useT();
  const router = useRouter();
  const f = useFormAction(requestService, { onSuccess: () => router.refresh() });
  return (
    <form onSubmit={f.onSubmit} noValidate>
      <FormMessage state={f.state && !f.state.ok ? f.state : null} />
      <div className="grid-form">
        <div className="field">
          <label>{t('Service')}</label>
          <select name="service" defaultValue={preselect ?? ''}>
            <option value="">{t('Select')}</option>
            {services.map((s) => (
              <option key={s.key} value={s.key}>
                {t(s.name)}
              </option>
            ))}
          </select>
        </div>
        <div className="field full">
          <label>{t('Tell us a little more')}</label>
          <textarea name="note" placeholder={t('Products, quantities, timelines, or questions for the team…')} />
        </div>
      </div>
      <SubmitButton pending={f.pending} className="btn saffron">
        Request this service
      </SubmitButton>
    </form>
  );
}

export function ServiceStatusSelect({ id, status }: { id: number; status: string }) {
  const t = useT();
  const router = useRouter();
  const cmd = useCommand();
  return (
    <select
      aria-label={t('Status')}
      value={status}
      disabled={cmd.busy}
      onChange={(e) => cmd.run(() => setServiceStatus(id, e.target.value), { onSuccess: () => router.refresh() })}
    >
      {SERVICE_STATUSES.map((s) => (
        <option key={s} value={s}>
          {t(SERVICE_STATUS_LABEL[s])}
        </option>
      ))}
    </select>
  );
}

export function DateText({ d }: { d: Date | string }) {
  return <>{fmtDate(d)}</>;
}
