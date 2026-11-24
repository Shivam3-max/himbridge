/**
 * Public positioning: products are grouped into two Himbridge collections rather than by country.
 * The country of origin stays in the data (customs paperwork needs it) but is never used as a selling point.
 */
export const ORIGINS = ['IN', 'CN'] as const;
export type Origin = (typeof ORIGINS)[number];
export type OriginPref = Origin | 'ANY';

export const COLLECTIONS: Record<Origin, { key: 'crafted' | 'engineered'; name: string; blurb: string; country: string }> = {
  IN: { key: 'crafted', name: 'Crafted', blurb: 'Handmade, artisanal & natural-material goods', country: 'India' },
  CN: { key: 'engineered', name: 'Engineered', blurb: 'Lighting, solar, appliances & modern furniture at scale', country: 'China' },
};

export const isOrigin = (v: unknown): v is Origin => v === 'IN' || v === 'CN';
export const collectionName = (o: string | null | undefined) => (isOrigin(o) ? COLLECTIONS[o].name : 'Any collection');
export const originFromCollectionKey = (key: string | null | undefined): Origin | undefined =>
  ORIGINS.find((o) => COLLECTIONS[o].key === key);
export const countryOfOrigin = (o: string | null | undefined) => (isOrigin(o) ? COLLECTIONS[o].country : undefined);
