'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { register } from '@/actions/auth';
import { Dropzone, SubmitButton, useFormAction } from '@/components/ui/forms';
import { FormMessage } from '@/components/ui/primitives';
import { NicheOptions } from '@/components/dashboard/trade-forms';
import type { SelfServiceRole } from '@/domain/roles';
import { useT } from '@/i18n/client';

const ROLES: [SelfServiceRole, string, string][] = [
  ['buyer', 'Buyer / Importer', 'Source products and post RFQs'],
  ['vendor', 'Manufacturer / Vendor', 'Factory, workshop or exporter'],
  ['logistics', 'Logistics Partner', 'Freight forwarder, CHA, inspection'],
];
const COUNTRIES = [
  'India',
  'United States',
  'United Arab Emirates',
  'United Kingdom',
  'Germany',
  'Netherlands',
  'Australia',
  'Canada',
  'Saudi Arabia',
  'South Africa',
  'Nigeria',
  'Kenya',
  'France',
  'Singapore',
];

export function RegisterForm({ initialRole }: { initialRole: SelfServiceRole }) {
  const t = useT();
  const router = useRouter();
  const [role, setRole] = useState<SelfServiceRole>(initialRole);
  const [country, setCountry] = useState('');
  const f = useFormAction(register, {
    reset: false,
    validate: (fd) => (fd.get('agree') ? null : 'Please accept the Terms of Use to continue.'),
    onSuccess: () => {
      router.push('/dashboard?welcome=1');
      router.refresh();
    },
  });
  useEffect(() => {
    if (f.state && !f.state.ok) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [f.state]);

  return (
    <form className="block" onSubmit={f.onSubmit} noValidate>
      <div className="block-head saffron">
        <h3>{t('Registration form')}</h3>
        <span className="tiny muted">
          {t('Fields marked')} <span style={{ color: 'var(--bad)' }}>*</span> {t('are mandatory')}
        </span>
      </div>
      <div className="block-body">
        <FormMessage state={f.state} />
        <div className="role-pick">
          {ROLES.map(([value, label, sub]) => (
            <label key={value}>
              <input
                type="radio"
                name="role"
                value={value}
                checked={role === value}
                onChange={() => {
                  setRole(value);
                  if (value === 'vendor' && !country) setCountry('India');
                }}
              />
              <b>{t(label)}</b>
              <span>{t(sub)}</span>
            </label>
          ))}
        </div>

        <h3 style={{ marginTop: 6 }}>{t('1. Contact & company')}</h3>
        <div className="grid-form">
          <div className="field">
            <label>
              {t('Full name')} <span className="req">*</span>
            </label>
            <input name="name" required />
          </div>
          <div className="field">
            <label>
              {t('Company name')} <span className="req">*</span>
            </label>
            <input name="company" required />
          </div>
          <div className="field">
            <label>
              {t('Business email')} <span className="req">*</span>
            </label>
            <input name="email" type="email" autoComplete="username" required />
          </div>
          <div className="field">
            <label>{t('Phone / WhatsApp')}</label>
            <input name="phone" />
          </div>
          <div className="field">
            <label>
              {t('Country')} <span className="req">*</span>
            </label>
            <input name="country" list="countries" required value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
          <div className="field">
            <label>
              {t('Password')} <span className="req">*</span> <span className="tiny muted">{t('(min 8 characters)')}</span>
            </label>
            <input name="password" type="password" autoComplete="new-password" required minLength={8} />
          </div>
        </div>

        <div hidden={role !== 'vendor'}>
          <h3>{t('2. Manufacturing profile')}</h3>
          <div className="grid-form">
            <div className="field">
              <label>{t('Factory country')}</label>
              <input value={t('India')} readOnly disabled />
              <span className="tiny muted">{t('Himbridge onboards Indian manufacturers only.')}</span>
            </div>
            <div className="field">
              <label>
                {t('Primary category')} <span className="req">*</span>
              </label>
              <select name="niche" defaultValue="">
                <option value="">{t('Select')}</option>
                <NicheOptions />
              </select>
            </div>
            <div className="field">
              <label>{t('City / cluster')}</label>
              <input name="cluster" placeholder={t('e.g. city / industrial cluster')} />
            </div>
            <div className="field">
              <label>{t('Years in business')}</label>
              <input name="years" type="number" min={0} />
            </div>
            <div className="field">
              <label>{t('Monthly capacity')}</label>
              <input name="capacity" placeholder={t('e.g. 10 containers / month')} />
            </div>
            <div className="field">
              <label>{t('Certifications')}</label>
              <input name="certifications" placeholder="IEC, GST, ISO 9001, BSCI, FSC, CE…" />
            </div>
            <div className="field full">
              <label>{t('About your company')}</label>
              <textarea name="about" />
            </div>
            <div className="field full">
              <label>{t('KYC documents')}</label>
              <Dropzone name="kyc" />
              <span className="tiny muted">
                {t(
                  'Export registration, tax registration, business licence, certificates. You can also add these later from your dashboard.',
                )}
              </span>
            </div>
          </div>
        </div>

        <label className="small" style={{ fontWeight: 400, display: 'flex', gap: 8, alignItems: 'flex-start', margin: '6px 0 16px' }}>
          <input type="checkbox" name="agree" style={{ width: 'auto', marginTop: 3 }} />{' '}
          {t('I confirm the details are correct and agree to the Himbridge Terms of Use and Privacy Policy.')}
        </label>
        <SubmitButton className="btn saffron" pending={f.pending}>
          Submit registration
        </SubmitButton>
        <span className="small muted" style={{ marginInlineStart: 10 }}>
          {t('Already registered?')} <Link href="/login">{t('Login')}</Link>
        </span>
      </div>
      <datalist id="countries">
        {COUNTRIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </form>
  );
}
