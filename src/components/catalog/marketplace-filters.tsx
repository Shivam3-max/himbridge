'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRef, useTransition } from 'react';
import { NICHES } from '@/domain/niches';
import { SECTORS, SECTOR_KEYS } from '@/domain/sectors';
import { useT } from '@/i18n/client';
import { Block } from '../ui/primitives';

/** Marketplace filters. Filters live in the URL (?q=&niche=&c=) so results are shareable and server-rendered. */
export function MarketplaceFilters({ q, niche, c }: { q: string; niche: string; c: string }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const form = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();

  const apply = (values?: { q: string; niche: string; c: string }) => {
    const fd = form.current ? new FormData(form.current) : null;
    const v = values ?? { q: String(fd?.get('q') ?? ''), niche: String(fd?.get('niche') ?? ''), c: String(fd?.get('c') ?? '') };
    const params = new URLSearchParams();
    if (v.q.trim()) params.set('q', v.q.trim());
    if (v.niche) params.set('niche', v.niche);
    if (v.c) params.set('c', v.c);
    const qs = params.toString();
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  return (
    <aside>
      <Block title={t('Filter Products')} tone="saffron" bodyClassName="">
        <form
          ref={form}
          className="block-body"
          key={`${q}|${niche}|${c}`}
          onSubmit={(e) => {
            e.preventDefault();
            apply();
          }}
          aria-busy={pending}
        >
          <div className="field">
            <label htmlFor="q">{t('Keyword')}</label>
            <input id="q" name="q" defaultValue={q} placeholder={t('e.g. rug, turmeric, brass')} />
          </div>
          <div className="field">
            <label>{t('Sector')}</label>
            <div className="small" style={{ display: 'grid', gap: 6 }}>
              {[['', 'All sectors'] as const, ...SECTOR_KEYS.map((k) => [k, SECTORS[k].name] as const)].map(([value, label]) => (
                <label key={value} className="radio-row">
                  <input type="radio" name="c" value={value} defaultChecked={c === value} onChange={() => apply()} /> {t(label)}
                </label>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="niche">{t('Category')}</label>
            <select id="niche" name="niche" defaultValue={niche} onChange={() => apply()}>
              <option value="">{t('All categories')}</option>
              {NICHES.map((n) => (
                <option key={n.slug} value={n.slug}>
                  {t(n.name)}
                </option>
              ))}
            </select>
          </div>
          <button className="btn" style={{ width: '100%' }} disabled={pending}>
            {t('Apply filters')}
          </button>
          <button
            className="btn ghost"
            type="button"
            style={{ width: '100%', marginTop: 8 }}
            onClick={() => apply({ q: '', niche: '', c: '' })}
          >
            {t('Clear')}
          </button>
        </form>
      </Block>
      <div style={{ marginTop: 16 }}>
        <Block title={t("Can't find it?")} tone="green" bodyClassName="block-body small">
          {t('Post a buying requirement and matched vendors will quote within 48 hours.')}
          <br />
          <br />
          <Link className="btn sm green" href="/dashboard/rfqs/new">
            {t('Post RFQ')}
          </Link>
        </Block>
      </div>
    </aside>
  );
}
