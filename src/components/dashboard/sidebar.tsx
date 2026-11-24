'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT } from '@/i18n/client';
import { cx } from '@/lib/format';
import { LogoutButton } from '../layout/header-controls';
import type { MenuItem } from './menu';

export function SidebarNav({ items }: { items: MenuItem[] }) {
  const pathname = usePathname();
  const t = useT();
  // The most specific matching entry is active (so /dashboard/rfqs/new doesn't also light up /dashboard/rfqs).
  const active = [...items]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))?.href;
  return (
    <nav aria-label={t('Dashboard')}>
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={cx(active === i.href && 'active')}>
          <span aria-hidden="true">{i.icon}</span>
          {t(i.label)}
        </Link>
      ))}
      <LogoutButton className="linkish side-logout">
        <span aria-hidden="true">⏻</span>
        {t('Logout')}
      </LogoutButton>
    </nav>
  );
}
