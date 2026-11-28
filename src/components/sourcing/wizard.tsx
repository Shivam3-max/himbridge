'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createSourcingRequest } from '@/actions/sourcing';
import { CategoryPicker } from '@/components/catalog/category-grid';
import { nicheName } from '@/domain/niches';
import {
  DELIVERY_TERM_LABEL,
  DELIVERY_TERMS,
  marginPct,
  ORDER_TIER_INFO,
  orderTier,
  REORDER_LABEL,
  REORDER_PLANS,
  REQUEST_KIND_INFO,
  REQUEST_KINDS,
  savingsPct,
  SHIP_MODE_INFO,
  SHIPPING_PREF_LABEL,
  SHIPPING_PREFS,
  suggestShipMode,
  targetValue,
  type RequestKind,
  type ShippingPref,
} from '@/domain/sourcing';
import { UNITS } from '@/domain/trade-reference';
import { useT } from '@/i18n/client';
import { cx, usd } from '@/lib/format';
import { Dropzone, SubmitButton, useFormAction } from '../ui/forms';
import { FormMessage } from '../ui/primitives';

interface ItemDraft {
  key: number;
  name: string;
  spec: string;
  referenceUrl: string;
  quantity: string;
  unit: string;
  currentPrice: string;
  targetPrice: string;
  retailPrice: string;
}

const num = (v: string) => (v.trim() === '' ? null : Number(v));
const blankItem = (key: number): ItemDraft => ({
  key,
  name: '',
  spec: '',
  referenceUrl: '',
  quantity: '',
  unit: 'pcs',
  currentPrice: '',
  targetPrice: '',
  retailPrice: '',
});
const isLink = (v: string) => v === '' || /^https?:\/\/\S+\.\S+/.test(v);

const STEPS = ['What you need', 'Products & prices', 'Delivery', 'Review & send'] as const;

export interface WizardDefaults {
  kind: RequestKind;
  niche?: string;
  title?: string;
  destination?: string;
  item?: { name?: string; quantity?: number; unit?: string; referenceUrl?: string };
}

/** Four-step "Start a sourcing request" form. All steps stay mounted, so nothing is lost when going back. */
export function SourcingWizard({ defaults }: { defaults: WizardDefaults }) {
  const t = useT();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<RequestKind>(defaults.kind);
  const [niche, setNiche] = useState(defaults.niche ?? '');
  const [title, setTitle] = useState(defaults.title ?? '');
  const [storeUrl, setStoreUrl] = useState('');
  const [items, setItems] = useState<ItemDraft[]>([
    {
      ...blankItem(1),
      name: defaults.item?.name ?? '',
      quantity: defaults.item?.quantity ? String(defaults.item.quantity) : '',
      unit: defaults.item?.unit ?? 'pcs',
      referenceUrl: defaults.item?.referenceUrl ?? '',
    },
  ]);
  const [destination, setDestination] = useState(defaults.destination ?? '');
  const [deliverBy, setDeliverBy] = useState('');
  const [shipping, setShipping] = useState<ShippingPref>('advise');
  const [terms, setTerms] = useState<string>('DDP');
  const [reorder, setReorder] = useState<string>('one_off');
  const [flags, setFlags] = useState({ samplesNeeded: true, privateLabel: kind === 'manufacture', customPackaging: false });
  const [brief, setBrief] = useState('');
  const [error, setError] = useState<string | null>(null);

  const f = useFormAction(createSourcingRequest, {
    reset: false,
    onSuccess: (newId) => router.push(newId ? `/dashboard/sourcing/${newId}?new=1` : '/dashboard/sourcing'),
  });

  const parsed = useMemo(
    () =>
      items.map((i) => ({
        name: i.name.trim(),
        spec: i.spec.trim(),
        referenceUrl: i.referenceUrl.trim(),
        quantity: Number(i.quantity) || 0,
        unit: i.unit,
        currentPrice: num(i.currentPrice),
        targetPrice: num(i.targetPrice),
        retailPrice: num(i.retailPrice),
      })),
    [items],
  );
  const value = targetValue(parsed);
  const currentValue = parsed.reduce((s, i) => s + (i.currentPrice ?? 0) * i.quantity, 0);
  const tier = orderTier(value);
  const mode = suggestShipMode(value, shipping);

  const update = (key: number, patch: Partial<ItemDraft>) => setItems((xs) => xs.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const addItem = () => setItems((xs) => (xs.length >= 30 ? xs : [...xs, blankItem(Math.max(...xs.map((x) => x.key)) + 1)]));

  /** Checks the current step; returns an error message or null. */
  function check(s: number): string | null {
    if (s === 0) {
      if (!niche) return 'Choose a product category';
      if (!title.trim()) return 'Give your request a name';
      if (!isLink(storeUrl.trim())) return 'Links must start with http:// or https://';
    }
    if (s === 1) {
      if (parsed.some((i) => !i.name)) return 'Every item needs a name';
      if (parsed.some((i) => !(i.quantity > 0))) return 'Every item needs a quantity';
      if (parsed.some((i) => !isLink(i.referenceUrl))) return 'Links must start with http:// or https://';
      if (parsed.some((i) => [i.currentPrice, i.targetPrice, i.retailPrice].some((p) => p != null && !(p > 0))))
        return 'Prices must be positive numbers';
    }
    if (s === 2 && !destination.trim()) return 'Where should we deliver?';
    return null;
  }
  const go = (to: number) => {
    if (to > step) {
      for (let s = step; s < to; s++) {
        const err = check(s);
        if (err) {
          setError(t(err));
          setStep(s);
          return;
        }
      }
    }
    setError(null);
    setStep(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const multi = kind === 'project' || items.length > 1;

  return (
    <form className="block wizard" onSubmit={f.onSubmit} noValidate>
      <ol className="wizard-steps" aria-label={t('Steps')}>
        {STEPS.map((s, i) => (
          <li key={s} className={cx(i === step && 'on', i < step && 'done')}>
            <button type="button" onClick={() => go(i)} aria-current={i === step ? 'step' : undefined}>
              <span>{i < step ? '✓' : i + 1}</span>
              {t(s)}
            </button>
          </li>
        ))}
      </ol>
      <div className="block-body">
        <FormMessage state={error ? { ok: false, error } : f.state && !f.state.ok ? f.state : null} />

        {/* Hidden fields carry the controlled state into the server action. */}
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="items" value={JSON.stringify(parsed)} />
        <input type="hidden" name="shipping" value={shipping} />
        {(['samplesNeeded', 'privateLabel', 'customPackaging'] as const).map((k) => (
          <input key={k} type="hidden" name={k} value={String(flags[k])} />
        ))}

        {/* Step 1 */}
        <div hidden={step !== 0}>
          <h3>{t('What do you need?')}</h3>
          <div className="kind-pick">
            {REQUEST_KINDS.map((k) => (
              <label key={k} className={cx(kind === k && 'on')}>
                <input type="radio" checked={kind === k} onChange={() => setKind(k)} />
                <span className="kind-ic" aria-hidden="true">
                  {REQUEST_KIND_INFO[k].icon}
                </span>
                <b>{t(REQUEST_KIND_INFO[k].label)}</b>
                <span>{t(REQUEST_KIND_INFO[k].sub)}</span>
              </label>
            ))}
          </div>
          <div className="grid-form">
            <div className="field full">
              <label>
                {t('Product category')} <span className="req">*</span>
              </label>
              <CategoryPicker value={niche} onChange={setNiche} />
            </div>
            <div className="field">
              <label>
                {kind === 'project' ? t('Project name') : t('Request name')} <span className="req">*</span>
              </label>
              <input
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  kind === 'project' ? t('e.g. Palm Villa, Dubai — living & dining') : t('e.g. Organic cotton tote bags, own label')
                }
              />
            </div>
            <div className="field full">
              <label>
                {kind === 'project' ? t('Your studio website or portfolio') : t('Your store or brand website')}{' '}
                <span className="tiny muted">{t('(optional — helps makers understand your style)')}</span>
              </label>
              <input name="storeUrl" value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} placeholder="https://" />
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div hidden={step !== 1}>
          <h3>{kind === 'project' ? t('Pieces for this project') : t('Products to source')}</h3>
          <p className="small muted">
            {t(
              'Add a reference link (your listing, a competitor or a Pinterest pin) and the prices you pay today. Offers are compared with your current and target price.',
            )}
          </p>
          {items.map((it, idx) => {
            const p = parsed[idx]!;
            const save = savingsPct(p.currentPrice, p.targetPrice);
            const margin = marginPct(p.retailPrice, p.targetPrice);
            return (
              <fieldset key={it.key} className="item-row">
                <legend>
                  {t('Item')} {idx + 1}
                  {items.length > 1 && (
                    <button type="button" className="linkish tiny" onClick={() => setItems((xs) => xs.filter((x) => x.key !== it.key))}>
                      {t('Remove')}
                    </button>
                  )}
                </legend>
                <div className="grid-form">
                  <div className="field">
                    <label>
                      {t('Product name')} <span className="req">*</span>
                    </label>
                    <input
                      value={it.name}
                      onChange={(e) => update(it.key, { name: e.target.value })}
                      placeholder={t('e.g. Jute rug 160 × 230 cm')}
                    />
                  </div>
                  <div className="field">
                    <label>{t('Product / reference link')}</label>
                    <input
                      value={it.referenceUrl}
                      onChange={(e) => update(it.key, { referenceUrl: e.target.value })}
                      placeholder="https://"
                    />
                  </div>
                  <div className="field">
                    <label>
                      {t('Quantity')} <span className="req">*</span>
                    </label>
                    <div className="inline-pair">
                      <input type="number" min="1" value={it.quantity} onChange={(e) => update(it.key, { quantity: e.target.value })} />
                      <select value={it.unit} onChange={(e) => update(it.key, { unit: e.target.value })}>
                        {UNITS.filter((u) => u !== 'containers').map((u) => (
                          <option key={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label>{t('What you pay now (USD / unit)')}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={it.currentPrice}
                      onChange={(e) => update(it.key, { currentPrice: e.target.value })}
                      placeholder={t('optional')}
                    />
                  </div>
                  <div className="field">
                    <label>{t('Target price (USD / unit)')}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={it.targetPrice}
                      onChange={(e) => update(it.key, { targetPrice: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>{t('Your selling price (USD / unit)')}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={it.retailPrice}
                      onChange={(e) => update(it.key, { retailPrice: e.target.value })}
                      placeholder={t('optional')}
                    />
                  </div>
                  <div className="field full">
                    <label>{t('Specifications')}</label>
                    <textarea
                      rows={2}
                      value={it.spec}
                      onChange={(e) => update(it.key, { spec: e.target.value })}
                      placeholder={t('Size, material, colour, finish, logo, packaging, certifications…')}
                    />
                  </div>
                </div>
                {(save != null || margin != null) && (
                  <div className="kv">
                    {save != null && (
                      <span>
                        {t('Target saving vs today')} <b className={save >= 0 ? 'up' : 'down'}>{save}%</b>
                      </span>
                    )}
                    {margin != null && (
                      <span>
                        {t('Margin at target price')} <b>{margin}%</b>
                      </span>
                    )}
                  </div>
                )}
              </fieldset>
            );
          })}
          <button type="button" className="btn sm ghost" onClick={addItem} disabled={items.length >= 30}>
            {multi ? t('+ Add another piece') : t('+ Add another product')}
          </button>
          <div className="field full" style={{ marginTop: 14 }}>
            <label>
              {t('Photos, drawings or tech-packs')}{' '}
              <span className="tiny muted">{t('(optional, up to 10 files, shared with matched makers)')}</span>
            </label>
            <Dropzone name="refs" />
          </div>
        </div>

        {/* Step 3 */}
        <div hidden={step !== 2}>
          <h3>{t('Delivery & preferences')}</h3>
          <div className="grid-form">
            <div className="field">
              <label>
                {kind === 'project' ? t('Project site (city, country)') : t('Deliver to (city, country)')} <span className="req">*</span>
              </label>
              <input
                name="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder={t('e.g. Austin, USA')}
              />
            </div>
            <div className="field">
              <label>{kind === 'project' ? t('Installation date') : t('Needed by')}</label>
              <input name="deliverBy" type="date" value={deliverBy} onChange={(e) => setDeliverBy(e.target.value)} />
            </div>
            <div className="field">
              <label>{t('How should it ship?')}</label>
              <select value={shipping} onChange={(e) => setShipping(e.target.value as ShippingPref)}>
                {SHIPPING_PREFS.map((s) => (
                  <option key={s} value={s}>
                    {t(SHIPPING_PREF_LABEL[s])}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t('Delivery terms')}</label>
              <select name="terms" value={terms} onChange={(e) => setTerms(e.target.value)}>
                {DELIVERY_TERMS.map((d) => (
                  <option key={d} value={d}>
                    {t(DELIVERY_TERM_LABEL[d])}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t('Will you reorder?')}</label>
              <select name="reorder" value={reorder} onChange={(e) => setReorder(e.target.value)}>
                {REORDER_PLANS.map((r) => (
                  <option key={r} value={r}>
                    {t(REORDER_LABEL[r])}
                  </option>
                ))}
              </select>
            </div>
            <div className="field toggles">
              {(
                [
                  ['samplesNeeded', 'I want samples before production'],
                  ['privateLabel', 'My own brand / labels'],
                  ['customPackaging', 'Custom packaging'],
                ] as const
              ).map(([k, label]) => (
                <label key={k} className="check">
                  <input type="checkbox" checked={flags[k]} onChange={(e) => setFlags((x) => ({ ...x, [k]: e.target.checked }))} />
                  {t(label)}
                </label>
              ))}
            </div>
            <div className="field full">
              <label>{t('Anything else we should know?')}</label>
              <textarea
                name="brief"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder={t('Who your customers are, quality level, certifications you need, budget, deadlines…')}
              />
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div hidden={step !== 3}>
          <h3>{t('Review & send')}</h3>
          <div className="review-grid">
            <div>
              <div className="kv" style={{ marginBottom: 8 }}>
                <span>
                  {t('Request')} <b>{title || '—'}</b>
                </span>
                <span>
                  {t('Type')} <b>{t(REQUEST_KIND_INFO[kind].label)}</b>
                </span>
                <span>
                  {t('Category')} <b>{niche ? t(nicheName(niche)) : '—'}</b>
                </span>
                <span>
                  {t('Deliver to')} <b>{destination || '—'}</b>
                </span>
              </div>
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>{t('Item')}</th>
                      <th className="right">{t('Qty')}</th>
                      <th className="right">{t('Now')}</th>
                      <th className="right">{t('Target')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((p, i) => (
                      <tr key={items[i]!.key}>
                        <td>{p.name || '—'}</td>
                        <td className="right">
                          {p.quantity || '—'} {p.unit}
                        </td>
                        <td className="right">{p.currentPrice ? usd(p.currentPrice) : '—'}</td>
                        <td className="right">{p.targetPrice ? usd(p.targetPrice) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <EstimateCard value={value} currentValue={currentValue} tier={tier} mode={mode} />
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>
            {t(
              'What happens next: our sourcing desk reviews your request within one working day and invites verified makers. You will see each offer here, compared with your prices.',
            )}
          </p>
        </div>

        <div className="wizard-nav">
          {step > 0 && (
            <button type="button" className="btn ghost" onClick={() => go(step - 1)}>
              ← {t('Back')}
            </button>
          )}
          <span className="tiny muted">
            {value > 0 && (
              <>
                {t('Target order value')} <b>{usd(value, 0)}</b> · {t(ORDER_TIER_INFO[tier].label)}
              </>
            )}
          </span>
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn saffron" onClick={() => go(step + 1)}>
              {t('Continue')} →
            </button>
          ) : (
            <SubmitButton pending={f.pending} className="btn saffron">
              Send request
            </SubmitButton>
          )}
        </div>
      </div>
    </form>
  );
}

/** Order size, suggested shipping mode and saving, shown while the buyer fills the form. */
export function EstimateCard({
  value,
  currentValue,
  tier,
  mode,
  valueLabel,
}: {
  valueLabel?: string;
  value: number;
  currentValue: number;
  tier: ReturnType<typeof orderTier>;
  mode: ReturnType<typeof suggestShipMode>;
}) {
  const t = useT();
  const saving = currentValue > 0 && value > 0 ? currentValue - value : null;
  return (
    <aside className="estimate">
      <div className="est-cell">
        <span>{valueLabel ?? t('Target order value')}</span>
        <b>{value > 0 ? usd(value, 0) : '—'}</b>
        {saving != null && (
          <small>
            {t('Saving vs what you pay now')}: <b className={saving >= 0 ? 'up' : 'down'}>{usd(saving, 0)}</b>
          </small>
        )}
      </div>
      <div className="est-cell">
        <span>{t('Order size')}</span>
        <b>{t(ORDER_TIER_INFO[tier].label)}</b>
        <small>{t(ORDER_TIER_INFO[tier].sub)}</small>
      </div>
      <div className="est-cell">
        <span>{t('Suggested shipping')}</span>
        <b>{t(SHIP_MODE_INFO[mode].label)}</b>
        <small>
          {t(SHIP_MODE_INFO[mode].transit)} · {t(SHIP_MODE_INFO[mode].sub)}
        </small>
      </div>
    </aside>
  );
}
