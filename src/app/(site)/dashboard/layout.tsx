import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { MENUS } from '@/components/dashboard/menu';
import { SidebarNav } from '@/components/dashboard/sidebar';
import { Badge, SectorChip } from '@/components/ui/primitives';
import { CategoryBadge } from '@/components/catalog/category-icon';
import { initials } from '@/lib/format';
import { ROLE_LABEL } from '@/domain/roles';
import { getI18n } from '@/i18n/server';
import { requirePageUser } from '@/server/auth/session';

export const metadata: Metadata = { title: 'Dashboard', robots: { index: false } };

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const me = await requirePageUser('/dashboard');
  const { t } = await getI18n();
  return (
    <>
      <div className="pagebar">
        <div className="wrap">
          <div className="crumbs">
            <Link href="/">{t('Home')}</Link> › {t('Dashboard')}
          </div>
          <h1>{t(`${ROLE_LABEL[me.role]} Dashboard`)}</h1>
          <p>
            {t('Welcome,')} {me.name} — {me.company}
          </p>
        </div>
      </div>
      <div className="wrap dash">
        <aside className="side block">
          <div className="side-user">
            {me.vendor ? (
              <CategoryBadge niche={me.vendor.niche} size={56} />
            ) : (
              <span className="avatar">{initials(me.company || me.name)}</span>
            )}
            <b style={{ marginTop: 8 }}>{me.company}</b>
            <span className="tiny muted">
              {me.name} · {t(ROLE_LABEL[me.role])}
            </span>
            {me.vendor && (
              <div style={{ marginTop: 6 }}>
                <SectorChip niche={me.vendor.niche} />{' '}
                <Badge tone={me.vendor.verification === 'verified' ? 'ok' : 'warn'}>{me.vendor.verification}</Badge>
              </div>
            )}
          </div>
          <SidebarNav items={MENUS[me.role]} />
        </aside>
        <section aria-live="polite">{children}</section>
      </div>
    </>
  );
}
