'use client';

import { useRouter } from 'next/navigation';
import { assignLogistics, confirmPayment, submitPayment, updateMilestone } from '@/actions/trade';
import { QC_DOC_LABELS, SHIPPING_DOC_LABELS, type FileKind } from '@/domain/files';
import { hasReached, INCOTERMS, nextStatus, ORDER_FLOW, STATUS_OWNER, statusLabel } from '@/domain/order-flow';
import { PAYMENT_LABEL } from '@/domain/payments';
import type { Role } from '@/domain/roles';
import { useT } from '@/i18n/client';
import { fmtDate, fmtNum, usd } from '@/lib/format';
import type { OrderDetail } from '@/server/services/orders';
import { Badge, CollectionChip, Empty, ProgressBar, StatusBadge, Timeline } from '../ui/primitives';
import { SubmitButton, useCommand, useFormAction } from '../ui/forms';
import { FileList, UploadForm } from './files';

type Viewer = { id: string; role: Role };
type Partner = { id: string; company: string };

/** Compact table of orders for overview pages. */
export function OrdersTable({ orders, viewerRole }: { orders: OrderDetail[]; viewerRole: Role }) {
  const t = useT();
  if (!orders.length) return <Empty>No orders yet.</Empty>;
  return (
    <div className="table-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>{t('Order')}</th>
            <th>{t('Item')}</th>
            <th>{t('Counterparty')}</th>
            <th className="right">{t('Value')}</th>
            <th>{t('Status')}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <b>{o.code}</b>
                <br />
                <span className="tiny muted">{fmtDate(o.createdAt)}</span>
              </td>
              <td>
                {o.title}
                <ProgressBar status={o.status} />
              </td>
              <td className="small">{viewerRole === 'buyer' ? o.vendorCompany : o.buyerCompany}</td>
              <td className="right nowrap">{usd(o.total, 0)}</td>
              <td>
                <StatusBadge status={o.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Full order card: parties, timeline, payments, documents and the actions this viewer may take. */
export function OrderCard({ order: o, viewer, partners = [] }: { order: OrderDetail; viewer: Viewer; partners?: Partner[] }) {
  const t = useT();
  const next = nextStatus(o.status);
  const owner = next ? STATUS_OWNER[next] : undefined;
  return (
    <div className="rfq-card">
      <header>
        <div>
          <b>{o.code}</b> — {o.title}
          <div className="tiny muted">
            {t('Created')} {fmtDate(o.createdAt)}
          </div>
        </div>
        <StatusBadge status={o.status} />
      </header>
      <div className="body">
        <div className="kv" style={{ marginBottom: 12 }}>
          <span>
            {t('Buyer')} <b>{o.buyerCompany}</b>
          </span>
          <span>
            {t('Vendor')} <b>{o.vendorCompany}</b> <CollectionChip origin={o.vendorOrigin} />
          </span>
          <span>
            {t('Qty')}{' '}
            <b>
              {fmtNum(o.quantity)} {o.unit}
            </b>
          </span>
          <span>
            {t('Unit')} <b>{usd(o.unitPrice)}</b>
          </span>
          <span>
            {t('Total')} <b>{usd(o.total)}</b>
          </span>
          <span>
            {t('Incoterm')} <b>{o.incoterm}</b>
          </span>
          <span>
            {t('Route')}{' '}
            <b>
              {o.originPort || '—'} → {o.destPort || o.destination || '—'}
            </b>
          </span>
          <span>
            {t('Logistics')} <b>{o.logisticsCompany ?? t('Not assigned')}</b>
          </span>
        </div>
        <div className="grid g2">
          <Timeline status={o.status} milestones={o.milestones} />
          <div>
            <Payments order={o} viewer={viewer} />
            <Documents order={o} viewer={viewer} />
            {viewer.role === 'admin' ? (
              <AdminOrderControls order={o} partners={partners} />
            ) : next && owner === viewer.role ? (
              <MilestoneForm orderId={o.id} next={next} />
            ) : next && viewer.role !== 'buyer' && owner ? (
              <div className="small muted">
                {t('Next milestone')} <b>{t(statusLabel(next))}</b> {t(`is updated by the ${owner} partner.`)}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function MilestoneForm({ orderId, next }: { orderId: number; next: string }) {
  const t = useT();
  const router = useRouter();
  const f = useFormAction(updateMilestone.bind(null, orderId), { toastErrors: true, onSuccess: () => router.refresh() });
  const label = t(statusLabel(next));
  return (
    <form onSubmit={f.onSubmit}>
      <input type="hidden" name="status" value={next} />
      <label>
        {t('Next milestone:')} {label}
      </label>
      <textarea name="note" placeholder={t('Note for buyer (e.g. vessel name, QC result)')} />
      <SubmitButton pending={f.pending} className="btn sm green" style={{ marginTop: 8 }}>
        {`${t('Mark as')} "${label}"`}
      </SubmitButton>
    </form>
  );
}

function AdminOrderControls({ order: o, partners }: { order: OrderDetail; partners: Partner[] }) {
  const t = useT();
  const router = useRouter();
  const assign = useFormAction(assignLogistics.bind(null, o.id), { toastErrors: true, reset: false, onSuccess: () => router.refresh() });
  const override = useFormAction(updateMilestone.bind(null, o.id), { toastErrors: true, reset: false, onSuccess: () => router.refresh() });
  return (
    <>
      <form onSubmit={assign.onSubmit}>
        <label>{t('Logistics assignment')}</label>
        <select name="logisticsId" defaultValue={o.logisticsId ?? ''}>
          <option value="">{t('Select partner')}</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.company}
            </option>
          ))}
        </select>
        <div className="grid-form" style={{ marginTop: 8 }}>
          <input name="mode" placeholder={t('Mode (e.g. Sea — 1 x 40HC)')} defaultValue={o.mode} />
          <select name="incoterm" defaultValue={o.incoterm}>
            {INCOTERMS.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </div>
        <div className="grid-form" style={{ marginTop: 8 }}>
          <input name="originPort" placeholder={t('Origin port')} defaultValue={o.originPort} />
          <input name="destPort" placeholder={t('Destination port')} defaultValue={o.destPort} />
        </div>
        <SubmitButton pending={assign.pending} className="btn sm" style={{ marginTop: 8 }}>
          Save logistics
        </SubmitButton>
      </form>
      <form onSubmit={override.onSubmit} style={{ marginTop: 14 }}>
        <input type="hidden" name="note" value="Status set by Himbridge operations." />
        <label>{t('Override status (admin)')}</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <select name="status" defaultValue={o.status}>
            {ORDER_FLOW.slice(1).map((s) => (
              <option key={s.key} value={s.key}>
                {t(s.label)}
              </option>
            ))}
          </select>
          <SubmitButton pending={override.pending} className="btn sm ghost">
            Set
          </SubmitButton>
        </div>
      </form>
    </>
  );
}

const PAY_BADGE = {
  due: <Badge tone="bad">Due</Badge>,
  submitted: <Badge tone="warn">Awaiting confirmation</Badge>,
  received: <Badge tone="ok">Received</Badge>,
} as const;

function Payments({ order: o, viewer }: { order: OrderDetail; viewer: Viewer }) {
  const t = useT();
  if (!o.payments.length) return null;
  const qcDone = hasReached(o.status, 'qc_passed');
  return (
    <>
      <label>{t('Payment schedule')}</label>
      <ul className="pay">
        {o.payments.map((p) => (
          <li key={p.id} className={p.status}>
            <span>
              <b>
                {t(PAYMENT_LABEL[p.stage])} {p.pct}%
              </b>{' '}
              · {usd(p.amount)}
              <br />
              <span className="tiny muted">
                {t(p.stage === 'advance' ? 'Releases production' : 'After QC, releases dispatch')}
                {p.reference ? ` · ${t('Ref')} ${p.reference}` : ''}
              </span>
            </span>
            {PAY_BADGE[p.status]}
            {viewer.role === 'buyer' && p.status !== 'received' && (p.stage === 'advance' || qcDone) && (
              <PaymentReferenceForm paymentId={p.id} current={p.reference} submitted={p.status === 'submitted'} />
            )}
            {viewer.role === 'admin' && p.status !== 'received' && <ConfirmPaymentButton paymentId={p.id} />}
          </li>
        ))}
      </ul>
    </>
  );
}

function PaymentReferenceForm({ paymentId, current, submitted }: { paymentId: number; current: string; submitted: boolean }) {
  const t = useT();
  const router = useRouter();
  const f = useFormAction(submitPayment.bind(null, paymentId), { toastErrors: true, reset: false, onSuccess: () => router.refresh() });
  return (
    <form onSubmit={f.onSubmit}>
      <input name="reference" placeholder={t('Bank / SWIFT / LC reference')} defaultValue={current} aria-label={t('Payment reference')} />
      <SubmitButton pending={f.pending} className="btn sm saffron">
        {submitted ? 'Update' : 'I have paid'}
      </SubmitButton>
    </form>
  );
}

function ConfirmPaymentButton({ paymentId }: { paymentId: number }) {
  const t = useT();
  const router = useRouter();
  const cmd = useCommand();
  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <button
        type="button"
        className="btn sm green"
        disabled={cmd.busy}
        onClick={() =>
          cmd.run(() => confirmPayment(paymentId), {
            confirm: 'Confirm these funds have been received in the Himbridge account?',
            onSuccess: () => router.refresh(),
          })
        }
      >
        {t('Confirm funds received')}
      </button>
    </form>
  );
}

function Documents({ order: o, viewer }: { order: OrderDetail; viewer: Viewer }) {
  const t = useT();
  const generated: [type: string, label: string, ready: boolean][] = [
    ['proforma', 'Proforma invoice', true],
    ['commercial', 'Commercial invoice', hasReached(o.status, 'qc_passed')],
    ['packing', 'Packing list', hasReached(o.status, 'qc_passed')],
  ];
  const canQc = viewer.role === 'vendor' || viewer.role === 'admin';
  const canShip = ['logistics', 'admin', 'vendor'].includes(viewer.role);
  const options: [FileKind, string][] = [
    ...(canQc ? QC_DOC_LABELS.map((l): [FileKind, string] => ['qc', l]) : []),
    ...(canShip ? SHIPPING_DOC_LABELS.map((l): [FileKind, string] => ['shipping', l]) : []),
  ];
  return (
    <>
      <label>{t('Trade documents')}</label>
      <div className="doc-links">
        {generated.map(([type, label, ready]) =>
          ready ? (
            <a key={type} className="btn sm ghost" href={`/documents/${o.id}/${type}`} target="_blank" rel="noopener">
              📄 {t(label)}
            </a>
          ) : (
            <span
              key={type}
              className="btn sm ghost"
              aria-disabled="true"
              style={{ opacity: 0.5, cursor: 'not-allowed' }}
              title={t('Available after QC')}
            >
              📄 {t(label)}
            </span>
          ),
        )}
      </div>
      {o.documents.length ? (
        <FileList files={o.documents} removable={viewer.role === 'admin'} />
      ) : (
        <div className="tiny muted" style={{ marginBottom: 10 }}>
          {t('No QC reports or shipping documents uploaded yet.')}
        </div>
      )}
      {options.length > 0 && <UploadForm refId={o.id} options={options} />}
    </>
  );
}
