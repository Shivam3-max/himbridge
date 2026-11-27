'use client';

import { useRouter } from 'next/navigation';
import { setBuyerType } from '@/actions/auth';
import { BUYER_TYPE_INFO, BUYER_TYPES } from '@/domain/sourcing';
import { useT } from '@/i18n/client';
import { useCommand } from '../ui/forms';

/** Radio cards for the buyer type; also used (uncontrolled, with a name) inside the registration form. */
export function BuyerTypeCards({ value, onChange, name }: { value: string; onChange: (v: string) => void; name?: string }) {
  const t = useT();
  return (
    <div className="role-pick">
      {BUYER_TYPES.map((b) => (
        <label key={b}>
          <input type="radio" name={name} value={b} checked={value === b} onChange={() => onChange(b)} />
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
