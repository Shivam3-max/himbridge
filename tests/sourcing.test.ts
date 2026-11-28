import { describe, expect, it } from 'vitest';
import { readinessItemsFor, readinessScore, READINESS_ITEMS, SERVICES } from '../src/domain/export-readiness';
import { AUDIENCES, audienceBySlug } from '../src/domain/audiences';
import {
  BUYER_TYPE_INFO,
  BUYER_TYPES,
  marginPct,
  offerTotal,
  orderTier,
  savingsPct,
  sourcingCode,
  stageIndex,
  suggestShipMode,
  targetValue,
} from '../src/domain/sourcing';
import { advancePctFor, splitPayments } from '../src/domain/payments';
import { offerSchema, sourcingSchema } from '../src/lib/validation';

describe('sourcing money helpers', () => {
  it('values a request at target prices, skipping lines without a target', () => {
    expect(
      targetValue([
        { quantity: 300, targetPrice: 4.2 },
        { quantity: 200, targetPrice: 5.8 },
        { quantity: 10, targetPrice: null },
      ]),
    ).toBe(2420);
  });
  it('computes savings and margin percentages', () => {
    expect(savingsPct(6.8, 3.95)).toBe(41.9);
    expect(savingsPct(4, 5)).toBe(-25);
    expect(savingsPct(null, 5)).toBeNull();
    expect(marginPct(34, 3.95)).toBe(88.4);
    expect(marginPct(0, 3)).toBeNull();
  });
  it('totals an offer from its priced lines only', () => {
    const items = [
      { id: 1, quantity: 300 },
      { id: 2, quantity: 200 },
    ];
    expect(
      offerTotal(items, [
        { itemId: 1, unitPrice: 3.95 },
        { itemId: 2, unitPrice: 5.6 },
      ]),
    ).toBe(2305);
    expect(offerTotal(items, [{ itemId: 2, unitPrice: 5.6 }])).toBe(1120);
  });
  it('formats sourcing codes', () => {
    expect(sourcingCode(7, 2026)).toBe('SRC-2026-0007');
  });
  it('orders the stage flow', () => {
    expect(stageIndex('submitted')).toBe(0);
    expect(stageIndex('ordered')).toBe(4);
    expect(stageIndex('closed')).toBe(-1);
  });
});

describe('order size and shipping guidance', () => {
  it('classifies orders into trade / mid / volume tiers (₹15 lakh and ₹1 crore cut-offs)', () => {
    expect(orderTier(2_000)).toBe('trade');
    expect(orderTier(17_000)).toBe('trade');
    expect(orderTier(18_000)).toBe('mid');
    expect(orderTier(120_000)).toBe('volume');
  });
  it('suggests a shipping mode by value unless the buyer chose one', () => {
    expect(suggestShipMode(1_400)).toBe('courier');
    expect(suggestShipMode(9_000)).toBe('air');
    expect(suggestShipMode(38_000)).toBe('lcl');
    expect(suggestShipMode(185_000)).toBe('fcl');
    expect(suggestShipMode(185_000, 'air')).toBe('air');
    expect(suggestShipMode(20_000, 'sea')).toBe('lcl');
  });
});

describe('export readiness', () => {
  it('only shows sector items to the sectors that need them', () => {
    const food = readinessItemsFor('food').map((i) => i.key);
    const home = readinessItemsFor('home').map((i) => i.key);
    expect(food).toContain('fssai');
    expect(home).not.toContain('fssai');
    expect(home).toContain('ispm15');
    expect(readinessItemsFor(undefined).every((i) => i.sectors.length === 0)).toBe(true);
  });
  it('scores required items; optional and not-applicable items do not count against you', () => {
    const items = readinessItemsFor('fashion');
    const required = items.filter((i) => !i.optional);
    const none = readinessScore(items, {});
    expect(none.score).toBe(0);
    expect(none.required).toBe(required.length);
    const all = readinessScore(items, Object.fromEntries(required.map((i) => [i.key, 'done'])));
    expect(all).toMatchObject({ score: 100, canShip: true });
    const withNa = readinessScore(items, {
      ...Object.fromEntries(required.slice(1).map((i) => [i.key, 'done'])),
      [required[0]!.key]: 'na',
    });
    expect(withNa.canShip).toBe(true);
  });
  it('has unique keys for checklist items and services', () => {
    expect(new Set(READINESS_ITEMS.map((i) => i.key)).size).toBe(READINESS_ITEMS.length);
    expect(new Set(SERVICES.map((s) => s.key)).size).toBe(SERVICES.length);
  });
});

describe('audiences', () => {
  it('has one landing page per buyer type, reachable by its slug', () => {
    const withPage = BUYER_TYPES.filter((b) => BUYER_TYPE_INFO[b].slug);
    for (const b of withPage) expect(audienceBySlug(BUYER_TYPE_INFO[b].slug)?.type).toBe(b);
    expect(AUDIENCES).toHaveLength(withPage.length);
  });
});

describe('sourcing validation', () => {
  const base = {
    kind: 'manufacture',
    niche: 'home-textiles',
    title: 'Cushion covers',
    destination: 'Melbourne, Australia',
    samplesNeeded: 'true',
    privateLabel: 'false',
    customPackaging: '',
  };
  it('parses JSON line items and checkbox values', () => {
    const v = sourcingSchema.parse({
      ...base,
      items: JSON.stringify([{ name: 'Cover', quantity: '300', unit: 'pcs', targetPrice: '4.2', currentPrice: '', referenceUrl: '' }]),
    });
    expect(v.items[0]).toMatchObject({ name: 'Cover', quantity: 300, targetPrice: 4.2, currentPrice: null });
    expect(v).toMatchObject({ samplesNeeded: true, privateLabel: false, customPackaging: false, shipping: 'advise', terms: 'DDP' });
  });
  it('rejects requests without items, bad links or non-positive prices', () => {
    expect(() => sourcingSchema.parse({ ...base, items: '[]' })).toThrow();
    expect(() => sourcingSchema.parse({ ...base, items: 'not json' })).toThrow();
    expect(() =>
      sourcingSchema.parse({ ...base, items: JSON.stringify([{ name: 'X', quantity: 1, referenceUrl: 'javascript:alert(1)' }]) }),
    ).toThrow();
    expect(() => sourcingSchema.parse({ ...base, items: JSON.stringify([{ name: 'X', quantity: 1, targetPrice: -2 }]) })).toThrow();
    expect(() => sourcingSchema.parse({ ...base, storeUrl: 'ftp://x', items: JSON.stringify([{ name: 'X', quantity: 1 }]) })).toThrow();
  });
  it('requires a priced line on offers', () => {
    expect(() => offerSchema.parse({ moq: 100, leadDays: 30, prices: '[]' })).toThrow();
    const o = offerSchema.parse({
      moq: '100',
      leadDays: '30',
      samplePrice: '',
      sampleDays: '',
      prices: JSON.stringify([{ itemId: 3, unitPrice: '4.5' }]),
    });
    expect(o).toMatchObject({ moq: 100, samplePrice: null, sampleDays: null, prices: [{ itemId: 3, unitPrice: 4.5 }] });
  });
});

describe('payment split by order size', () => {
  it('uses 50/50 for trade orders and 30/70 above', () => {
    expect(splitPayments(2305, advancePctFor(orderTier(2305)))).toEqual([
      { stage: 'advance', pct: 50, amount: 1152.5 },
      { stage: 'balance', pct: 50, amount: 1152.5 },
    ]);
    expect(advancePctFor(orderTier(185_000))).toBe(30);
  });
});

describe('category icons', () => {
  it('every category has its own icon', async () => {
    const { NICHES } = await import('../src/domain/niches');
    const { hasCategoryIcon } = await import('../src/components/catalog/category-icon');
    expect(NICHES.filter((n) => !hasCategoryIcon(n.slug)).map((n) => n.slug)).toEqual([]);
  });
});
