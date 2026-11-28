import { describe, expect, it } from 'vitest';
import { detectType, safeFileName } from '@/domain/files';
import { landedCost } from '@/domain/landed-cost';
import { checkTransition, hasReached, nextStatus, orderCode } from '@/domain/order-flow';
import { splitPayments } from '@/domain/payments';
import { NICHES } from '@/domain/niches';
import { SECTOR_KEYS, nichesInSector, sectorName, sectorOf } from '@/domain/sectors';

const base = { hasLogistics: true, advancePaid: true, balancePaid: true } as const;

describe('order milestones', () => {
  it('lets the vendor move an order into production once the advance is paid', () => {
    expect(checkTransition({ ...base, role: 'vendor', current: 'confirmed', next: 'in_production' })).toBeNull();
    expect(checkTransition({ ...base, advancePaid: false, role: 'vendor', current: 'confirmed', next: 'in_production' })).toMatch(
      /advance/,
    );
  });

  it('only allows the owning party to set a milestone', () => {
    expect(checkTransition({ ...base, role: 'logistics', current: 'confirmed', next: 'in_production' })).toMatch(/another party/);
    expect(checkTransition({ ...base, role: 'buyer', current: 'qc_passed', next: 'shipped' })).toMatch(/another party/);
  });

  it('requires milestones in order, except for admins', () => {
    expect(checkTransition({ ...base, role: 'vendor', current: 'confirmed', next: 'qc_passed' })).toMatch(/in order/);
    expect(checkTransition({ ...base, role: 'admin', current: 'confirmed', next: 'delivered' })).toBeNull();
  });

  it('blocks dispatch until the balance is paid and a logistics partner is assigned', () => {
    expect(checkTransition({ ...base, balancePaid: false, role: 'logistics', current: 'qc_passed', next: 'shipped' })).toMatch(/balance/);
    expect(checkTransition({ ...base, hasLogistics: false, role: 'admin', current: 'qc_passed', next: 'shipped' })).toMatch(
      /logistics partner/,
    );
  });

  it('never lets anyone move back to "confirmed"', () => {
    expect(checkTransition({ ...base, role: 'admin', current: 'shipped', next: 'confirmed' })).toBe('Unknown status');
  });

  it('knows the next step and progress', () => {
    expect(nextStatus('qc_passed')).toBe('shipped');
    expect(nextStatus('delivered')).toBeUndefined();
    expect(hasReached('shipped', 'qc_passed')).toBe(true);
    expect(hasReached('in_production', 'qc_passed')).toBe(false);
  });

  it('formats order codes', () => {
    expect(orderCode(7, 2026)).toBe('HBG-2026-0007');
  });
});

describe('payments', () => {
  it('splits 30 / 70 and always adds up to the total', () => {
    expect(splitPayments(57600)).toEqual([
      { stage: 'advance', pct: 30, amount: 17280 },
      { stage: 'balance', pct: 70, amount: 40320 },
    ]);
    const odd = splitPayments(100.01);
    expect(odd[0]!.amount + odd[1]!.amount).toBeCloseTo(100.01, 2);
  });
});

describe('landed cost', () => {
  it('matches the reference calculation', () => {
    const r = landedCost({
      fob: 15.4,
      qty: 1200,
      freight: 2800,
      insPct: 0.5,
      dutyPct: 6.5,
      vatPct: 0,
      local: 650,
      feePct: 5,
      basis: 'cif',
    });
    expect(r.fobValue).toBe(18480);
    expect(r.cif).toBeCloseTo(21386.4, 2);
    expect(r.perUnit).toBeCloseTo(20.29, 2);
  });

  it('uses FOB value for duty when asked (USA, Canada)', () => {
    const r = landedCost({ fob: 10, qty: 100, freight: 0, insPct: 0, dutyPct: 10, vatPct: 0, local: 0, feePct: 0, basis: 'fob' });
    expect(r.duty).toBe(100);
  });
});

describe('uploads', () => {
  it('detects real file types from their bytes', () => {
    expect(detectType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(detectType(new TextEncoder().encode('%PDF-1.7'))).toBe('application/pdf');
    expect(detectType(new TextEncoder().encode('<html>not an image'))).toBeUndefined();
  });

  it('sanitises file names', () => {
    expect(safeFileName('../../etc/passwd', 'file')).toBe('.._.._etc_passwd');
    expect(safeFileName('   ', 'file.pdf')).toBe('file.pdf');
  });
});

describe('sectors', () => {
  it('assigns every niche to exactly one known sector', () => {
    for (const n of NICHES) expect(SECTOR_KEYS).toContain(n.sector);
    const all = SECTOR_KEYS.flatMap((k) => nichesInSector(k));
    expect(all.sort()).toEqual(NICHES.map((n) => n.slug).sort());
  });

  it('resolves a niche to its sector name', () => {
    expect(sectorOf('spices')).toBe('food');
    expect(sectorName('rugs')).toBe('Home & Living');
    expect(sectorName('unknown')).toBe('All sectors');
  });
});
