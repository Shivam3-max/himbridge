export interface LandedCostInput {
  /** Unit FOB price in USD. */
  fob: number;
  qty: number;
  /** Total freight in USD. */
  freight: number;
  /** Insurance as % of CFR value. */
  insPct: number;
  dutyPct: number;
  vatPct: number;
  /** Clearance and local charges in USD. */
  local: number;
  /** Himbridge service fee as % of FOB value. */
  feePct: number;
  /** Customs value used for duty: CIF (EU, UK, UAE, AU…) or FOB (USA, Canada). */
  basis: 'cif' | 'fob';
}

export function landedCost(v: LandedCostInput) {
  const fobValue = v.fob * v.qty;
  const cfr = fobValue + v.freight;
  const insurance = (cfr * v.insPct) / 100;
  const cif = cfr + insurance;
  const duty = ((v.basis === 'fob' ? fobValue : cif) * v.dutyPct) / 100;
  const vat = ((cif + duty) * v.vatPct) / 100;
  const fee = (fobValue * v.feePct) / 100;
  const total = cif + duty + vat + v.local + fee;
  return { fobValue, freight: v.freight, insurance, cif, duty, vat, local: v.local, fee, total, perUnit: v.qty ? total / v.qty : 0 };
}
