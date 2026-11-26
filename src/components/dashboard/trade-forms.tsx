'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  acceptQuote,
  createNotice,
  createProduct,
  createRfq,
  deleteProduct,
  setVendorStatus,
  submitQuote,
  uploadFiles,
} from '@/actions/trade';
import { SECTORS, SECTOR_KEYS, sectorOf, type SectorKey } from '@/domain/sectors';
import { ACCEPT_IMAGES } from '@/domain/files';
import { NICHES } from '@/domain/niches';
import { UNITS } from '@/domain/trade-reference';
import { useT } from '@/i18n/client';
import { authClient } from '@/lib/auth-client';
import { usd } from '@/lib/format';
import { FormMessage } from '../ui/primitives';
import { Dropzone, SubmitButton, useCommand, useFormAction } from '../ui/forms';
import { useToast } from '../ui/toast';

/** Niche options grouped by sector; pass `sector` to limit the list to one sector. */
export function NicheOptions({ sector }: { sector?: SectorKey }) {
  const t = useT();
  return (
    <>
      {SECTOR_KEYS.filter((k) => !sector || k === sector).map((k) => (
        <optgroup key={k} label={t(SECTORS[k].name)}>
          {NICHES.filter((n) => n.sector === k).map((n) => (
            <option key={n.slug} value={n.slug}>
              {t(n.name)}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}

const Req = () => <span className="req">*</span>;

// ── Buyer ────────────────────────────────────────────────────

export function PostRfqForm({ defaults }: { defaults: { title?: string; niche?: string; destination?: string } }) {
  const t = useT();
  const router = useRouter();
  const f = useFormAction(createRfq, { onSuccess: () => router.push('/dashboard/rfqs') });
  return (
    <form onSubmit={f.onSubmit} noValidate>
      <FormMessage state={f.state && !f.state.ok ? f.state : null} />
      <div className="grid-form">
        <div className="field full">
          <label>
            {t('Requirement title')} <Req />
          </label>
          <input name="title" defaultValue={defaults.title} placeholder={t('e.g. Hand-knotted wool rugs for autumn collection')} />
        </div>
        <div className="field">
          <label>
            {t('Niche')} <Req />
          </label>
          <select name="niche" defaultValue={defaults.niche ?? ''}>
            <option value="">{t('Select')}</option>
            <NicheOptions />
          </select>
        </div>
        <div className="field">
          <label>
            {t('Quantity')} <Req />
          </label>
          <input name="quantity" type="number" min="1" />
        </div>
        <div className="field">
          <label>{t('Unit')}</label>
          <select name="unit">
            {UNITS.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>
            {t('Destination port / city')} <Req />
          </label>
          <input name="destination" placeholder={t('e.g. Los Angeles, USA')} defaultValue={defaults.destination} />
        </div>
        <div className="field">
          <label>{t('Target unit price (USD)')}</label>
          <input name="targetPrice" type="number" step="0.01" min="0" />
        </div>
        <div className="field full">
          <label>{t('Specifications')}</label>
          <textarea name="details" placeholder={t('Material, size, finish, packaging, certifications, delivery window…')} />
        </div>
        <div className="field full">
          <label>
            {t('Reference images / tech-pack')} <span className="tiny muted">{t('(optional, shared with quoting vendors)')}</span>
          </label>
          <Dropzone name="refs" />
        </div>
      </div>
      <SubmitButton pending={f.pending} className="btn saffron">
        Submit RFQ
      </SubmitButton>
    </form>
  );
}

export function AcceptQuoteButton({ quoteId }: { quoteId: number }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const cmd = useCommand();
  return (
    <button
      className="btn sm green"
      disabled={cmd.busy}
      onClick={() =>
        cmd.run(() => acceptQuote(quoteId), {
          confirm: 'Accept this quotation? An order will be created and other quotes will be declined.',
          onSuccess: (code) => {
            toast(t(`Order ${code} created`));
            router.push('/dashboard/orders');
          },
        })
      }
    >
      {t('Accept')}
    </button>
  );
}

// ── Vendor ───────────────────────────────────────────────────

export function QuoteForm({
  rfqId,
  quantity,
  existing,
}: {
  rfqId: number;
  quantity: number;
  existing: { unitPrice: number; leadDays: number; note: string } | null;
}) {
  const t = useT();
  const router = useRouter();
  const [price, setPrice] = useState(existing?.unitPrice ? String(existing.unitPrice) : '');
  const f = useFormAction(submitQuote.bind(null, rfqId), { toastErrors: true, reset: false, onSuccess: () => router.refresh() });
  return (
    <details className="inline">
      <summary>{t(existing ? 'Revise quotation' : 'Submit quotation')}</summary>
      <form onSubmit={f.onSubmit}>
        <div className="grid-form three">
          <div className="field">
            <label>{t('Unit price (USD, FOB)')}</label>
            <input name="unitPrice" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('Lead time (days)')}</label>
            <input name="leadDays" type="number" defaultValue={existing?.leadDays ?? ''} />
          </div>
          <div className="field">
            <label>{t('Order value')}</label>
            <input disabled value={price ? usd(Number(price) * quantity, 0) : '—'} />
          </div>
          <div className="field full">
            <label>{t('Note to buyer')}</label>
            <textarea name="note" defaultValue={existing?.note ?? ''} />
          </div>
        </div>
        <SubmitButton pending={f.pending} className="btn sm green">
          Send quotation
        </SubmitButton>
      </form>
    </details>
  );
}

export function ProductForm({ vendorNiche, open }: { vendorNiche: string; open: boolean }) {
  const t = useT();
  const router = useRouter();
  const f = useFormAction(createProduct, { onSuccess: () => router.refresh() });
  return (
    <details className="inline" open={open}>
      <summary>{t('+ Add a new product')}</summary>
      <form onSubmit={f.onSubmit} noValidate>
        <FormMessage state={f.state && !f.state.ok ? f.state : null} />
        <div className="grid-form">
          <div className="field full">
            <label>
              {t('Product title')} <Req />
            </label>
            <input name="title" />
          </div>
          <div className="field">
            <label>
              {t('Niche')} <Req />
            </label>
            <select name="niche" defaultValue={vendorNiche}>
              <NicheOptions sector={sectorOf(vendorNiche)} />
            </select>
          </div>
          <div className="field">
            <label>{t('HS code')}</label>
            <input name="hsCode" placeholder={t('e.g. 9403.60')} />
          </div>
          <div className="field">
            <label>
              {t('MOQ')} <Req />
            </label>
            <input name="moq" type="number" min="1" />
          </div>
          <div className="field">
            <label>{t('Unit')}</label>
            <select name="unit">
              {UNITS.filter((u) => u !== 'containers').map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>
              {t('FOB price min (USD)')} <Req />
            </label>
            <input name="priceMin" type="number" step="0.01" />
          </div>
          <div className="field">
            <label>
              {t('FOB price max (USD)')} <Req />
            </label>
            <input name="priceMax" type="number" step="0.01" />
          </div>
          <div className="field">
            <label>
              {t('Lead time (days)')} <Req />
            </label>
            <input name="leadDays" type="number" min="1" />
          </div>
          <div className="field">
            <label>{t('Material')}</label>
            <input name="material" />
          </div>
          <div className="field full">
            <label>{t('Description')}</label>
            <textarea name="description" />
          </div>
          <div className="field full">
            <label>
              {t('Product photos')} <span className="tiny muted">{t('(up to 6 · first photo is the cover)')}</span>
            </label>
            <Dropzone name="photos" accept={ACCEPT_IMAGES} hint="JPG, PNG or WEBP · max 5 MB each · 800 × 600 or larger" />
          </div>
        </div>
        <SubmitButton pending={f.pending} className="btn saffron">
          Save product
        </SubmitButton>
      </form>
    </details>
  );
}

/** "+ Photos" picker that uploads straight away. */
export function AddProductPhotos({ productId }: { productId: number }) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <label className="tiny" style={{ display: 'block', marginTop: 4, cursor: 'pointer', color: 'var(--blue)' }}>
      {busy ? t('Please wait…') : t('+ Photos')}
      <input
        type="file"
        accept={ACCEPT_IMAGES}
        multiple
        hidden
        disabled={busy}
        onChange={async (e) => {
          const files = [...(e.target.files ?? [])];
          if (!files.length) return;
          const fd = new FormData();
          fd.set('kind', 'product');
          fd.set('refId', String(productId));
          files.forEach((f) => fd.append('files', f));
          setBusy(true);
          const r = await uploadFiles(null, fd);
          setBusy(false);
          e.target.value = '';
          if (r.ok) {
            toast(t('Photos added'));
            router.refresh();
          } else toast(r.error, true);
        }}
      />
    </label>
  );
}

export function DeleteProductButton({ productId }: { productId: number }) {
  const t = useT();
  const router = useRouter();
  const cmd = useCommand();
  return (
    <button
      className="btn sm danger"
      disabled={cmd.busy}
      onClick={() =>
        cmd.run(() => deleteProduct(productId), { confirm: 'Remove this product from your catalog?', onSuccess: () => router.refresh() })
      }
    >
      {t('Remove')}
    </button>
  );
}

// ── Admin ────────────────────────────────────────────────────

export function VendorStatusButtons({ vendorId, status }: { vendorId: string; status: string }) {
  const t = useT();
  const router = useRouter();
  const cmd = useCommand();
  const set = (s: string) => cmd.run(() => setVendorStatus(vendorId, s), { onSuccess: () => router.refresh() });
  return (
    <>
      {status !== 'verified' && (
        <button className="btn sm green" disabled={cmd.busy} onClick={() => set('verified')}>
          {t('Verify')}
        </button>
      )}{' '}
      {status !== 'suspended' ? (
        <button className="btn sm danger" disabled={cmd.busy} onClick={() => set('suspended')}>
          {t('Suspend')}
        </button>
      ) : (
        <button className="btn sm ghost" disabled={cmd.busy} onClick={() => set('pending')}>
          {t('Re-review')}
        </button>
      )}
    </>
  );
}

export function NoticeForm() {
  const t = useT();
  const router = useRouter();
  const f = useFormAction(createNotice, { onSuccess: () => router.refresh() });
  return (
    <form onSubmit={f.onSubmit}>
      <FormMessage state={f.state && !f.state.ok ? f.state : null} />
      <div className="grid-form">
        <div className="field full">
          <label>
            {t('Title')} <Req />
          </label>
          <input name="title" />
        </div>
        <div className="field">
          <label>{t('Tag')}</label>
          <select name="tag">
            {['Notice', 'Update', 'Advisory', 'Trade Fair', 'Programme'].map((tag) => (
              <option key={tag} value={tag}>
                {t(tag)}
              </option>
            ))}
          </select>
        </div>
        <div className="field full">
          <label>{t('Details')}</label>
          <textarea name="body" />
        </div>
      </div>
      <SubmitButton pending={f.pending} className="btn saffron">
        Publish
      </SubmitButton>
    </form>
  );
}

// ── Account ──────────────────────────────────────────────────

export function ChangePasswordForm() {
  const t = useT();
  const [msg, setMsg] = useState<{ ok: boolean; error?: string; message?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const d = Object.fromEntries(new FormData(form)) as Record<string, string>;
        if ((d.password ?? '').length < 8) return setMsg({ ok: false, error: t('New password must be at least 8 characters') });
        if (d.password !== d.confirm) return setMsg({ ok: false, error: t('The new passwords do not match.') });
        setBusy(true);
        const { error } = await authClient.changePassword({
          currentPassword: d.current ?? '',
          newPassword: d.password!,
          revokeOtherSessions: true,
        });
        setBusy(false);
        if (error)
          setMsg({
            ok: false,
            error: t(
              error.message === 'Invalid password'
                ? 'Current password is incorrect'
                : (error.message ?? 'Something went wrong. Please try again.'),
            ),
          });
        else {
          setMsg({ ok: true, message: t('Password updated.') });
          form.reset();
        }
      }}
    >
      <FormMessage state={msg} />
      <div className="grid-form three">
        <div className="field">
          <label>{t('Current password')}</label>
          <input name="current" type="password" autoComplete="current-password" />
        </div>
        <div className="field">
          <label>{t('New password')}</label>
          <input name="password" type="password" autoComplete="new-password" minLength={8} />
        </div>
        <div className="field">
          <label>{t('Confirm new password')}</label>
          <input name="confirm" type="password" autoComplete="new-password" />
        </div>
      </div>
      <SubmitButton pending={busy} className="btn sm">
        Update password
      </SubmitButton>
    </form>
  );
}
