'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { setLocale } from '@/actions/auth';
import { useI18n } from '@/i18n/client';
import { LOCALES } from '@/i18n/config';
import { authClient } from '@/lib/auth-client';
import { cx } from '@/lib/format';
import { useStoredValue } from '@/lib/hooks';

export function LanguageSelect() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select
      aria-label={t('Language')}
      value={locale}
      disabled={pending}
      onChange={(e) =>
        start(async () => {
          await setLocale(e.target.value);
          router.refresh();
        })
      }
    >
      {Object.entries(LOCALES).map(([k, v]) => (
        <option key={k} value={k}>
          {v.label}
        </option>
      ))}
    </select>
  );
}

const SIZES = ['13', '15', '17'] as const;
export function FontSizeButtons() {
  const { t } = useI18n();
  const [stored, setSize] = useStoredValue('hbg-fs', '15');
  const size = (SIZES as readonly string[]).includes(stored) ? stored : '15';
  useEffect(() => {
    document.documentElement.style.setProperty('--fs', `${size}px`);
  }, [size]);
  return (
    <span className="fs-btns" aria-label={t('Text size')}>
      {(['A-', 'A', 'A+'] as const).map((label, i) => (
        <button key={label} type="button" className={cx(size === SIZES[i] && 'on')} onClick={() => setSize(SIZES[i]!)}>
          {label}
        </button>
      ))}
    </span>
  );
}

export function MainNav({ items, children }: { items: [href: string, label: string][]; children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();
  // The menu remembers which page it was opened on, so it closes by itself after navigation.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href);
  return (
    <nav className={cx('nav', open && 'open')} aria-label={t('Main')}>
      <div className="wrap">
        <button
          type="button"
          className="nav-toggle"
          aria-label={t('Menu')}
          aria-expanded={open}
          onClick={() => setOpenOn(open ? null : pathname)}
        >
          ☰
        </button>
        <ul>
          {items.map(([href, label]) => (
            <li key={href}>
              <Link href={href} className={cx(isActive(href) && 'active')}>
                {t(label)}
              </Link>
            </li>
          ))}
        </ul>
        <div className="nav-user">{children}</div>
      </div>
    </nav>
  );
}

export function LogoutButton({ className = 'btn sm ghost', children }: { className?: string; children?: React.ReactNode }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await authClient.signOut();
          router.push('/');
          router.refresh();
        })
      }
    >
      {children ?? t('Logout')}
    </button>
  );
}
