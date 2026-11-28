import type { CSSProperties, ReactNode } from 'react';
import { getNiche } from '@/domain/niches';

/**
 * Line icons for every product category (keyed by niche slug, 24 × 24, stroke = currentColor).
 * A category added to src/domain/niches.ts without its own icon automatically gets the generic box icon,
 * so new categories always show up with an icon and their colour.
 */
const ICONS: Record<string, ReactNode> = {
  // Brass vase / pot
  handicrafts: (
    <>
      <path d="M9 3h6M10 3v2.5C7 7 5.5 9.5 5.5 13a6.5 6.5 0 0 0 13 0c0-3.5-1.5-6-4.5-7.5V3" />
      <path d="M6 12h12M7 16h10" />
    </>
  ),
  // Armchair
  'wood-furniture': (
    <>
      <path d="M6 11V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5" />
      <path d="M4 11h3v3h10v-3h3v6H4z" />
      <path d="M6 17v3M18 17v3" />
    </>
  ),
  // Rug with fringe
  rugs: (
    <>
      <rect x="5" y="4" width="14" height="16" rx="1" />
      <rect x="8" y="7" width="8" height="10" />
      <path d="M12 9.5 14 12l-2 2.5L10 12z" />
      <path d="M7 4V2M10 4V2M14 4V2M17 4V2M7 22v-2M10 22v-2M14 22v-2M17 22v-2" />
    </>
  ),
  // Cushion
  'home-textiles': (
    <>
      <path d="M4 6c2.5 1 5.5 1 8 0s5.5-1 8 0c-1 2.7-1 9.3 0 12-2.5-1-5.5-1-8 0s-5.5 1-8 0c1-2.7 1-9.3 0-12z" />
      <path d="M8 10h8M8 14h8" />
    </>
  ),
  // Stone slabs
  stone: (
    <>
      <path d="M3 18 6 9h12l3 9z" />
      <path d="M6 9 8 4h8l2 5" />
      <path d="M9 13l2 2M14 12l-1 3" />
    </>
  ),
  // Mortar and pestle
  spices: (
    <>
      <path d="M4 11h16a8 8 0 0 1-16 0z" />
      <path d="M8 20h8" />
      <path d="M13 11 19 4" />
      <circle cx="9" cy="9" r=".6" />
      <circle cx="11.5" cy="8" r=".6" />
    </>
  ),
  // Ear of grain
  'rice-grains': (
    <>
      <path d="M12 22V8" />
      <path d="M12 8c-2-1-2-4 0-6 2 2 2 5 0 6z" />
      <path d="M12 13c-2.5 0-4-2-4-4 2.5 0 4 2 4 4zM12 13c2.5 0 4-2 4-4-2.5 0-4 2-4 4z" />
      <path d="M12 18c-2.5 0-4-2-4-4 2.5 0 4 2 4 4zM12 18c2.5 0 4-2 4-4-2.5 0-4 2-4 4z" />
    </>
  ),
  // Cup with steam
  'tea-coffee': (
    <>
      <path d="M4 10h13v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z" />
      <path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M8 3c-1 1 1 2 0 3.5M12 3c-1 1 1 2 0 3.5" />
    </>
  ),
  // Cashew
  'nuts-superfoods': (
    <>
      <path d="M16 4c3 2 4 7 1 11-3 5-10 6-12 2-1.5-3 2-4.5 4.5-4C12 13.5 13 11 12 9c-1-2.5 1.5-6 4-5z" />
      <path d="M14 7c1 2 1 5-1 7" />
    </>
  ),
  // Gem
  jewellery: (
    <>
      <path d="M6 4h12l3 5-9 11L3 9z" />
      <path d="M3 9h18M9 4 8 9l4 11M15 4l1 5-4 11" />
    </>
  ),
  // Handbag
  leather: (
    <>
      <path d="M4 9h16l-1.5 11h-13z" />
      <path d="M8.5 9V7a3.5 3.5 0 0 1 7 0v2" />
      <path d="M9 13h6" />
    </>
  ),
  // T-shirt
  apparel: (
    <>
      <path d="M8 3 3 6l2 4 2.5-1V21h9V9l2.5 1 2-4-5-3c-.5 1.5-2 2.5-4 2.5S8.5 4.5 8 3z" />
    </>
  ),
  // Thread spool
  'handloom-silk': (
    <>
      <path d="M6 3h12M6 21h12" />
      <path d="M8 3v18M16 3v18" />
      <path d="M8 7l8 3M8 11l8 3M8 15l8 3" />
    </>
  ),
  // Leaf
  wellness: (
    <>
      <path d="M5 19C5 10 11 4 20 4c0 9-6 15-15 15z" />
      <path d="M5 19 14 10" />
    </>
  ),
  // Dropper bottle
  'essential-oils': (
    <>
      <path d="M10 2h4v4h-4z" />
      <path d="M9 6h6v2.5c2 1 3 2.5 3 4.5v6a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-6c0-2 1-3.5 3-4.5z" />
      <path d="M12 12.5c1.3 1.5 1.8 2.5 1.8 3.2a1.8 1.8 0 0 1-3.6 0c0-.7.5-1.7 1.8-3.2z" />
    </>
  ),
  // Diya (oil lamp)
  'incense-festive': (
    <>
      <path d="M3 13h18c-1 4-4.5 6-9 6s-8-2-9-6z" />
      <path d="M12 3c2 2.3 2.5 4 2.5 5.2a2.5 2.5 0 0 1-5 0C9.5 7 10 5.3 12 3z" />
      <path d="M17 13l3-2" />
    </>
  ),
};

const FALLBACK = (
  <>
    <path d="M3 8 12 3l9 5v8l-9 5-9-5z" />
    <path d="M3 8l9 5 9-5M12 13v8" />
  </>
);

/** The line icon for a category. */
export function CategoryIcon({ niche, size = 24, className }: { niche: string | null | undefined; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {(niche && ICONS[niche]) || FALLBACK}
    </svg>
  );
}

/** A round category badge: the category photo (or its icon if it has none), ringed in the category colour. */
export function CategoryBadge({ niche, size = 44 }: { niche: string | null | undefined; size?: number }) {
  const n = getNiche(niche);
  const color = n?.color ?? '#0b2a5b';
  return (
    <span className={`cat-badge${n?.image ? ' photo' : ''}`} style={{ '--c': color, width: size, height: size } as CSSProperties}>
      {n?.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- small static category photo
        <img src={n.image} alt="" loading="lazy" width={size} height={size} />
      ) : (
        <CategoryIcon niche={niche} size={Math.round(size * 0.55)} />
      )}
    </span>
  );
}

/**
 * Category artwork used until a maker uploads product photos: the category photo (or, for a category
 * without one, its colour with a large icon), so product cards and tiles never look empty.
 */
export function CategoryCover({
  niche,
  className,
  children,
  label,
}: {
  niche: string | null | undefined;
  className?: string;
  children?: ReactNode;
  label?: string;
}) {
  const n = getNiche(niche);
  const color = n?.color ?? '#0b2a5b';
  return (
    <div
      className={`cat-cover${n?.image ? ' photo' : ''} ${className ?? ''}`}
      style={{ '--c': color } as CSSProperties}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {n?.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- static category photo
        <img className="cat-cover-img" src={n.image} alt="" loading="lazy" />
      ) : (
        <CategoryIcon niche={niche} size={56} className="cat-cover-ic" />
      )}
      {children}
    </div>
  );
}

/** True if this category has its own drawn icon (used by tests to keep every category covered). */
export const hasCategoryIcon = (slug: string) => slug in ICONS;
