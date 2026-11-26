'use client';

import { useMemo, useState } from 'react';
import { landedCost, type LandedCostInput } from '@/domain/landed-cost';
import { SECTORS, SECTOR_KEYS, type SectorKey } from '@/domain/sectors';
import { EXPORT_DOCS_BY_SECTOR, EXPORT_DOCS_COMMON, HS_CODES } from '@/domain/trade-reference';
import { useT } from '@/i18n/client';
import { usd } from '@/lib/format';

const FIELDS: [key: keyof Omit<LandedCostInput, 'basis'>, label: string, step?: string][] = [
  ['fob', 'Unit FOB price (USD)', '0.01'],
  ['qty', 'Quantity'],
  ['freight', 'Freight total (USD)'],
  ['insPct', 'Insurance (% of CFR)', '0.01'],
  ['dutyPct', 'Import duty (%)', '0.1'],
  ['vatPct', 'VAT / sales tax (%)', '0.1'],
  ['local', 'Clearance & local (USD)'],
  ['feePct', 'Himbridge service fee (%)', '0.1'],
];

const DEFAULTS: Record<keyof Omit<LandedCostInput, 'basis'>, string> = {
  fob: '15.40',
  qty: '1200',
  freight: '2800',
  insPct: '0.5',
  dutyPct: '6.5',
  vatPct: '0',
  local: '650',
  feePct: '5',
};

/** Landed cost calculator: inputs on the left, live estimate on the right. */
export function LandedCostCalculator() {
  const t = useT();
  const [values, setValues] = useState(DEFAULTS);
  const [basis, setBasis] = useState<'cif' | 'fob'>('cif');
  const r = useMemo(() => {
    const n = (k: keyof typeof DEFAULTS) => Number(values[k]) || 0;
    return landedCost({
      fob: n('fob'),
      qty: n('qty'),
      freight: n('freight'),
      insPct: n('insPct'),
      dutyPct: n('dutyPct'),
      vatPct: n('vatPct'),
      local: n('local'),
      feePct: n('feePct'),
      basis,
    });
  }, [values, basis]);
  const rows: [string, number, boolean?][] = [
    ['FOB goods value', r.fobValue],
    ['Freight', r.freight],
    ['Insurance', r.insurance],
    ['CIF value', r.cif, true],
    ['Import duty', r.duty],
    ['VAT / sales tax', r.vat],
    ['Clearance & local', r.local],
    ['Himbridge service fee', r.fee],
    ['Total landed cost', r.total, true],
  ];
  return (
    <div className="split">
      <div className="block" id="landed">
        <div className="block-head saffron">
          <h3>{t('Landed Cost Calculator')}</h3>
          <span className="tiny muted">{t('Estimate only — rates are editable')}</span>
        </div>
        <form className="block-body" onSubmit={(e) => e.preventDefault()}>
          <div className="grid-form three">
            {FIELDS.map(([key, label, step]) => (
              <div key={key} className="field">
                <label htmlFor={`lc-${key}`}>{t(label)}</label>
                <input
                  id={`lc-${key}`}
                  type="number"
                  step={step}
                  value={values[key]}
                  onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="field">
              <label htmlFor="lc-basis">{t('Duty basis')}</label>
              <select id="lc-basis" value={basis} onChange={(e) => setBasis(e.target.value as 'cif' | 'fob')}>
                <option value="cif">{t('CIF value (EU, UK, UAE, AU…)')}</option>
                <option value="fob">{t('FOB value (USA, Canada)')}</option>
              </select>
            </div>
          </div>
        </form>
      </div>
      <div className="block">
        <div className="block-head green">
          <h3>{t('Estimate')}</h3>
        </div>
        <div className="block-body">
          <table className="tbl" aria-live="polite">
            <tbody>
              {rows.map(([label, value, bold]) => (
                <tr key={label}>
                  <td>{bold ? <b>{t(label)}</b> : t(label)}</td>
                  <td className="right">{bold ? <b>{usd(value)}</b> : usd(value)}</td>
                </tr>
              ))}
              <tr>
                <td>
                  <b style={{ color: 'var(--green)' }}>{t('Landed cost per unit')}</b>
                </td>
                <td className="right">
                  <b style={{ color: 'var(--green)', fontSize: '1.1rem' }}>{usd(r.perUnit)}</b>
                </td>
              </tr>
            </tbody>
          </table>
          <p className="tiny muted" style={{ marginTop: 10 }}>
            {t('Duty rates vary by HS code, origin and current trade policy. Confirm with a licensed customs broker before pricing.')}
          </p>
        </div>
      </div>
    </div>
  );
}

export function HsCodeFinder() {
  const t = useT();
  const [q, setQ] = useState('');
  const rows = HS_CODES.filter((r) => r.join(' ').toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="block" id="hs">
      <div className="block-head">
        <h3>{t('HS Code Finder')}</h3>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('Search e.g. brass, rug, LED, chair')}
          aria-label={t('HS Code Finder')}
          style={{ maxWidth: 280 }}
        />
      </div>
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>{t('HS code')}</th>
              <th>{t('Description')}</th>
              <th>{t('Typical niche')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map(([code, desc, niche]) => (
                <tr key={code}>
                  <td>
                    <b>{code}</b>
                  </td>
                  <td>{t(desc)}</td>
                  <td className="small muted">{t(niche)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="muted">
                  {t('No match — ask the help desk for classification.')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="tiny muted" style={{ padding: '8px 14px', margin: 0 }}>
        {t('6-digit HS codes are international; 8–10 digit national tariff lines differ by country.')}
      </p>
    </div>
  );
}

export function ExportDocsChecklist() {
  const t = useT();
  const [sector, setSector] = useState<SectorKey>('home');
  return (
    <div className="block" id="docs">
      <div className="block-head saffron">
        <h3>{t('Export Documentation Checklist')}</h3>
        <select value={sector} onChange={(e) => setSector(e.target.value as SectorKey)} style={{ maxWidth: 190 }} aria-label={t('Sector')}>
          {SECTOR_KEYS.map((k) => (
            <option key={k} value={k}>
              {t(SECTORS[k].name)}
            </option>
          ))}
        </select>
      </div>
      <div className="block-body">
        <ul className="small" style={{ margin: 0, paddingLeft: 0, listStyle: 'none', lineHeight: 2 }}>
          {[...EXPORT_DOCS_COMMON, ...EXPORT_DOCS_BY_SECTOR[sector]].map((d) => (
            <li key={d}>☐ {t(d)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
