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

/** Splits an order total into the payment plan. Rounding drift goes to the last stage so the parts always add up. */
export function splitPayments(total: number) {
  let allocated = 0;
  return PAYMENT_PLAN.map((p, i) => {
    const amount = i === PAYMENT_PLAN.length - 1 ? round2(total - allocated) : round2((total * p.pct) / 100);
    allocated = round2(allocated + amount);
    return { stage: p.stage, pct: p.pct, amount };
  });
}

export const orderTotal = (unitPrice: number, quantity: number) => round2(unitPrice * quantity);
