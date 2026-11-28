'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { NICHES } from '@/domain/niches';
import { SECTORS, SECTOR_KEYS, type SectorKey } from '@/domain/sectors';
import { useT } from '@/i18n/client';
import { cx } from '@/lib/format';
import { CategoryBadge } from './category-icon';

/**
 * Every category as an icon tile. Built from src/domain/niches.ts, so a new category appears here
 * (with its icon) automatically. `base` is the link prefix the category slug is appended to (e.g. "/marketplace?niche="); `counts` shows live listings per category.
 */
export function CategoryGrid({
  base,
  counts,
  active,
  compact = false,
  sector,
}: {
  base: string;
  counts?: Record<string, number>;
  active?: string;
  compact?: boolean;
  sector?: SectorKey;
}) {
  const t = useT();
  return (
    <div className={cx('cat-grid', compact && 'compact')}>
      {SECTOR_KEYS.flatMap((k) => NICHES.filter((n) => n.sector === k))
        .filter((n) => !sector || n.sector === sector)
        .map((n) => (
          <Link
            key={n.slug}
            href={`${base}${n.slug}`}
            className={cx('cat-tile', active === n.slug && 'on')}
            style={{ '--c': n.color } as CSSProperties}
            aria-current={active === n.slug ? 'true' : undefined}
          >
            {compact || !n.image ? (
              <CategoryBadge niche={n.slug} size={compact ? 40 : 52} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- static category photo
              <img className="cat-photo" src={n.image} alt="" loading="lazy" />
            )}
            <span className="cat-name">{t(n.name)}</span>
            {counts && <span className="cat-count">{counts[n.slug] ? t(`${counts[n.slug]} products`) : t('Sourcing on request')}</span>}
          </Link>
        ))}
    </div>
  );
}

/**
 * Category chooser with icons, grouped by sector (registration, sourcing requests).
 * Submits as a normal form field `name`; controlled when `value` + `onChange` are passed.
 */
export function CategoryPicker({
  name = 'niche',
  value,
  defaultValue,
  onChange,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (slug: string) => void;
}) {
  const t = useT();
  return (
    <div className="cat-picker" role="radiogroup">
      {SECTOR_KEYS.map((k) => (
        <fieldset key={k}>
          <legend>{t(SECTORS[k].name)}</legend>
          <div className="cat-picker-grid">
            {NICHES.filter((n) => n.sector === k).map((n) => (
              <label key={n.slug} style={{ '--c': n.color } as CSSProperties}>
                <input
                  type="radio"
                  name={name}
                  value={n.slug}
                  {...(value !== undefined ? { checked: value === n.slug } : { defaultChecked: defaultValue === n.slug })}
                  onChange={() => onChange?.(n.slug)}
                />
                <CategoryBadge niche={n.slug} size={32} />
                <span>{t(n.name)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

/** Header photo per sector (one of its categories). */
const SECTOR_COVER: Record<SectorKey, string> = {
  home: 'rugs',
  food: 'spices',
  fashion: 'handloom-silk',
  wellness: 'incense-festive',
};

/**
 * Home page "Browse by category": one card per sector with a header photo and its categories listed
 * underneath (photo, name, live listings). Balanced at every width: 4 → 2 → 1 columns.
 */
export function SectorShowcase({ counts }: { counts: Record<string, number> }) {
  const t = useT();
  return (
    <div className="sector-showcase">
      {SECTOR_KEYS.map((k) => {
        const niches = NICHES.filter((n) => n.sector === k);
        const cover = NICHES.find((n) => n.slug === SECTOR_COVER[k])?.image;
        return (
          <section key={k} className="sector-card">
            <Link href={`/marketplace?c=${k}`} className="sector-head">
              {/* eslint-disable-next-line @next/next/no-img-element -- static category photo */}
              {cover && <img src={cover} alt="" />}
              <span className="sector-head-text">
                <b>{t(SECTORS[k].name)}</b>
                <small>{t(`${niches.length} categories`)}</small>
              </span>
            </Link>
            <ul>
              {niches.map((n) => (
                <li key={n.slug}>
                  <Link href={`/marketplace?niche=${n.slug}`} style={{ '--c': n.color } as CSSProperties}>
                    <CategoryBadge niche={n.slug} size={40} />
                    <span className="sc-name">
                      {t(n.name)}
                      <small>{counts[n.slug] ? t(`${counts[n.slug]} products`) : t('Sourcing on request')}</small>
                    </span>
                    <span className="sc-go" aria-hidden="true">
                      ›
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link className="sector-all" href={`/marketplace?c=${k}`}>
              {t('Browse all')} {t(SECTORS[k].name)} →
            </Link>
          </section>
        );
      })}
    </div>
  );
}
