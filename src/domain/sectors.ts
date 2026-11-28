import { NICHES, getNiche } from './niches';

/**
 * Himbridge sources only from Indian manufacturers. Products are grouped into four sectors
 * for browsing, filtering and RFQ routing; each niche belongs to exactly one sector.
 */
export const SECTOR_KEYS = ['home', 'food', 'fashion', 'wellness'] as const;
export type SectorKey = (typeof SECTOR_KEYS)[number];

export const SECTORS: Record<SectorKey, { name: string; blurb: string }> = {
  home: { name: 'Home & Living', blurb: 'Handicrafts, furniture, rugs, stone and home textiles' },
  food: { name: 'Food & Agri', blurb: 'Spices, basmati rice, tea, coffee, cashew and superfoods' },
  fashion: { name: 'Fashion & Textiles', blurb: 'Apparel, handloom silk, leather goods and jewellery' },
  wellness: { name: 'Wellness & Natural', blurb: 'Ayurveda, essential oils, incense and festive décor' },
};

/** Every vendor on the platform manufactures in India; customs paperwork uses this. */
export const ORIGIN_COUNTRY = 'India';

export const isSector = (v: unknown): v is SectorKey => typeof v === 'string' && (SECTOR_KEYS as readonly string[]).includes(v);
export const sectorOf = (niche: string | null | undefined): SectorKey | undefined => getNiche(niche)?.sector;
export const sectorName = (niche: string | null | undefined) => {
  const s = sectorOf(niche);
  return s ? SECTORS[s].name : 'All sectors';
};
export const nichesInSector = (sector: SectorKey) => NICHES.filter((n) => n.sector === sector).map((n) => n.slug);
