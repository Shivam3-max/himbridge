/** Milestone payments: 30% advance on confirmation (unlocks production), 70% balance after QC (unlocks dispatch). */
export const PAYMENT_PLAN = [
  { stage: 'advance', pct: 30 },
  { stage: 'balance', pct: 70 },
] as const;

export type PaymentStage = (typeof PAYMENT_PLAN)[number]['stage'];
export const PAYMENT_STATUSES = ['due', 'submitted', 'received'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_LABEL: Record<PaymentStage, string> = { advance: 'Advance', balance: 'Balance' };

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Splits an order total into an advance and a balance (30/70 by default; small trade orders use 50/50).
 * Rounding drift goes to the balance so the parts always add up.
 */
export function splitPayments(total: number, advancePct: number = PAYMENT_PLAN[0].pct) {
  const advance = round2((total * advancePct) / 100);
  return [
    { stage: 'advance' as const, pct: advancePct, amount: advance },
    { stage: 'balance' as const, pct: 100 - advancePct, amount: round2(total - advance) },
  ];
}

/** Advance percentage by order size: 50% for trade-size orders, 30% for mid and volume orders. */
export const advancePctFor = (tier: 'trade' | 'mid' | 'volume') => (tier === 'trade' ? 50 : PAYMENT_PLAN[0].pct);

export const orderTotal = (unitPrice: number, quantity: number) => round2(unitPrice * quantity);
