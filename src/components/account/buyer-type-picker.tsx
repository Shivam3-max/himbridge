'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { setBuyerType } from '@/actions/auth';
import { BUYER_TYPE_INFO, BUYER_TYPES, type BuyerType } from '@/domain/sourcing';
import { useT } from '@/i18n/client';
import { useCommand } from '../ui/forms';

const svg = (children: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    width="26"
    height="26"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

/** One icon per buyer type: container ship, shopping bag, drafting compass, sparkle (custom). */
const ICONS: Record<BuyerType, ReactNode> = {
  importer: svg(
    <>
      <path d="M3 15h18l-2.5 5h-13z" />
      <path d="M6 15V9h5v6M11 15V6h5v9M16 15v-4h3v4" />
    </>,
  ),
  brand: svg(
    <>
      <path d="M5 8h14l-1 13H6z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>,
  ),
  designer: svg(
    <>
      <circle cx="12" cy="5" r="2" />
      <path d="M11 7 6 21M13 7l5 14M8.5 15h7" />
    </>,
  ),
  other: svg(
    <>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="m6 6 2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </>,
  ),
};

/** Buyer type cards (importer, brand, designer, other) with icons; used in registration and on the profile page. */
export function BuyerTypeCards({ value, onChange, name }: { value: string; onChange: (v: string) => void; name?: string }) {
  const t = useT();
  return (
    <div className="role-pick buyer-pick">
      {BUYER_TYPES.map((b) => (
        <label key={b}>
          <input type="radio" name={name} value={b} checked={value === b} onChange={() => onChange(b)} />
          <span className="buyer-ic">{ICONS[b]}</span>
          <b>{t(BUYER_TYPE_INFO[b].label)}</b>
          <span>{t(BUYER_TYPE_INFO[b].sub)}</span>
        </label>
      ))}
    </div>
  );
}

export function BuyerTypePicker({ current }: { current: string }) {
  const router = useRouter();
  const cmd = useCommand();
  return <BuyerTypeCards value={current} onChange={(v) => cmd.run(() => setBuyerType(v), { onSuccess: () => router.refresh() })} />;
}
