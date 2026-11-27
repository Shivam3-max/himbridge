/**
 * Sourcing projects — the managed sourcing desk for brands, designers and importers.
 *
 * A buyer describes what they want made or sourced (one or more line items, each with a reference link,
 * current price, target price and quantity). Matched Indian manufacturers send offers with a price per line;
 * the buyer compares them against their current and target price, orders samples, then places a production
 * order, which continues through the normal order / payment / shipping flow.
 */

/** Who the buyer is. Drives their dashboard, defaults and the landing page they came from. */
export const BUYER_TYPES = ['brand', 'designer', 'importer'] as const;
export type BuyerType = (typeof BUYER_TYPES)[number];
export const BUYER_TYPE_INFO: Record<BuyerType, { label: string; sub: string; slug: string }> = {
  brand: { label: 'E-commerce brand / boutique', sub: 'Small batches, private label, samples first', slug: 'brands' },
  designer: { label: 'Architect / interior designer', sub: 'Project-based sourcing, custom pieces', slug: 'designers' },
  importer: { label: 'Importer / distributor', sub: 'Bulk and container orders', slug: 'importers' },
};
export const isBuyerType = (v: unknown): v is BuyerType => typeof v === 'string' && (BUYER_TYPES as readonly string[]).includes(v);

/** What kind of help the buyer needs. */
export const REQUEST_KINDS = ['source', 'manufacture', 'project'] as const;
export type RequestKind = (typeof REQUEST_KINDS)[number];
export const REQUEST_KIND_INFO: Record<RequestKind, { label: string; sub: string; icon: string }> = {
  source: {
    label: 'Find a product',
    sub: 'You have a product link or photo. We find Indian makers who already make it.',
    icon: '⌕',
  },
  manufacture: {
    label: 'Make my design',
    sub: 'Your own design or private label: custom sizes, colours, logo and packaging.',
    icon: '✎',
  },
  project: {
    label: 'Furnish a project',
    sub: 'A list of pieces for a hotel, villa, restaurant or store (BOQ / spec sheet).',
    icon: '▦',
  },
};
export const DEFAULT_KIND: Record<BuyerType, RequestKind> = { brand: 'manufacture', designer: 'project', importer: 'source' };

/** Sourcing project stages, in order. */
export const SOURCING_FLOW = [
  { key: 'submitted', label: 'Request received', who: 'You' },
  { key: 'matching', label: 'Matching manufacturers', who: 'Himbridge' },
  { key: 'offers', label: 'Offers ready', who: 'Manufacturers' },
  { key: 'sampling', label: 'Samples', who: 'You & manufacturer' },
  { key: 'ordered', label: 'Production order placed', who: 'You' },
] as const;
export const SOURCING_STAGES = [...SOURCING_FLOW.map((s) => s.key), 'closed'] as const;
export type SourcingStage = (typeof SOURCING_STAGES)[number];
export const stageIndex = (s: string) => SOURCING_FLOW.findIndex((x) => x.key === s);
export const stageLabel = (s: string) => (s === 'closed' ? 'Closed' : (SOURCING_FLOW.find((x) => x.key === s)?.label ?? s));
/** Stages in which manufacturers may still send or revise offers. */
export const OPEN_STAGES: SourcingStage[] = ['submitted', 'matching', 'offers', 'sampling'];

export const SHIPPING_PREFS = ['advise', 'courier', 'air', 'sea'] as const;
export type ShippingPref = (typeof SHIPPING_PREFS)[number];
export const SHIPPING_PREF_LABEL: Record<ShippingPref, string> = {
  advise: 'Advise me (cheapest that meets my date)',
  courier: 'Express courier, door to door',
  air: 'Air cargo',
  sea: 'Sea freight',
};

export const DELIVERY_TERMS = ['DDP', 'DAP', 'CIF', 'FOB'] as const;
export type DeliveryTerm = (typeof DELIVERY_TERMS)[number];
export const DELIVERY_TERM_LABEL: Record<DeliveryTerm, string> = {
  DDP: 'DDP: delivered to my door, duties paid',
  DAP: 'DAP: delivered to my door, I pay duties',
  CIF: 'CIF: to my port, I clear customs',
  FOB: 'FOB: Indian port, I arrange freight',
};

export const REORDER_PLANS = ['one_off', 'monthly', 'quarterly', 'seasonal'] as const;
export type ReorderPlan = (typeof REORDER_PLANS)[number];
export const REORDER_LABEL: Record<ReorderPlan, string> = {
  one_off: 'One-off order',
  monthly: 'Monthly repeat',
  quarterly: 'Quarterly repeat',
  seasonal: 'Seasonal collection',
};

export const OFFER_STATUSES = ['submitted', 'sample_requested', 'accepted', 'declined'] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];
export const OFFER_STATUS_LABEL: Record<OfferStatus, string> = {
  submitted: 'Offer received',
  sample_requested: 'Samples requested',
  accepted: 'Ordered',
  declined: 'Not selected',
};

/** Reference shown to customers, e.g. SRC-2026-0012. */
export const sourcingCode = (id: number, year = new Date().getFullYear()) => `SRC-${year}-${String(id).padStart(4, '0')}`;

// ── Money helpers ────────────────────────────────────────────

export interface PricedLine {
  quantity: number;
  currentPrice?: number | null;
  targetPrice?: number | null;
  retailPrice?: number | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Order value at the buyer's target prices (lines without a target are skipped). */
export const targetValue = (lines: PricedLine[]) => round2(lines.reduce((s, l) => s + (l.targetPrice ?? 0) * l.quantity, 0));

/** Percentage saved versus what the buyer pays today (positive = cheaper). Null when not comparable. */
export function savingsPct(current: number | null | undefined, offered: number | null | undefined): number | null {
  if (!current || !offered || current <= 0) return null;
  return Math.round(((current - offered) / current) * 1000) / 10;
}

/** Gross margin the buyer keeps at their retail price (positive = profit). Null when not comparable. */
export function marginPct(retail: number | null | undefined, cost: number | null | undefined): number | null {
  if (!retail || !cost || retail <= 0) return null;
  return Math.round(((retail - cost) / retail) * 1000) / 10;
}

/** Total of an offer: unit price per line × that line's quantity. Lines the offer did not price are ignored. */
export function offerTotal(items: { id: number; quantity: number }[], prices: { itemId: number; unitPrice: number }[]) {
  const byItem = new Map(prices.map((p) => [p.itemId, p.unitPrice]));
  return round2(items.reduce((s, i) => s + (byItem.get(i.id) ?? 0) * i.quantity, 0));
}

// ── Order size & shipping guidance (from the Order & Delivery Playbook) ──

export const USD_INR = 88;

export type OrderTier = 'trade' | 'mid' | 'volume';
export const ORDER_TIER_INFO: Record<OrderTier, { label: string; range: string; sub: string }> = {
  trade: {
    label: 'Trade order',
    range: 'up to ₹15 lakh (~$17,000)',
    sub: 'Designers, boutiques, D2C brands: samples first, card or 50/50 payment, door-to-door delivery.',
  },
  mid: {
    label: 'Mid-size order',
    range: '₹15 lakh – ₹1 crore (~$17,000 – $115,000)',
    sub: 'Growing brands and small importers: shared or full container, 30/70 payment.',
  },
  volume: {
    label: 'Volume order',
    range: 'above ₹1 crore (~$115,000+)',
    sub: 'Importers and retail chains: full containers, LC or 30/70, inspection before dispatch.',
  },
};

export function orderTier(valueUsd: number): OrderTier {
  const inr = valueUsd * USD_INR;
  if (inr < 15_00_000) return 'trade';
  if (inr < 1_00_00_000) return 'mid';
  return 'volume';
}

export type ShipMode = 'courier' | 'air' | 'lcl' | 'fcl';
export const SHIP_MODE_INFO: Record<ShipMode, { label: string; transit: string; sub: string }> = {
  courier: {
    label: 'Express courier',
    transit: '4–8 days',
    sub: 'Door to door with duties prepaid (DDP). Best for samples and small batches.',
  },
  air: {
    label: 'Air cargo',
    transit: '5–10 days door to door',
    sub: 'For urgent or high-value goods too heavy for courier. Customs broker clears at destination.',
  },
  lcl: {
    label: 'Sea freight, shared container (LCL)',
    transit: '25–45 days',
    sub: 'Pay only for the cubic metres you use. Good for 2–15 CBM of furniture, rugs or décor.',
  },
  fcl: {
    label: 'Sea freight, full container (FCL)',
    transit: '20–40 days port to port',
    sub: "A 20' or 40' container to yourself: lowest cost per unit for volume orders.",
  },
};

/** Suggested way to ship an order, from its value (and the buyer's preference, when they gave one). */
export function suggestShipMode(valueUsd: number, pref: ShippingPref = 'advise'): ShipMode {
  if (pref === 'courier') return 'courier';
  if (pref === 'air') return 'air';
  if (pref === 'sea') return valueUsd < 60_000 ? 'lcl' : 'fcl';
  if (valueUsd < 3_000) return 'courier';
  if (valueUsd < 15_000) return 'air';
  if (valueUsd < 60_000) return 'lcl';
  return 'fcl';
}
