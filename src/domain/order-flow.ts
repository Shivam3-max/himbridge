import type { Role } from './roles';

/** Order milestones, in the only order they may happen. */
export const ORDER_FLOW = [
  { key: 'confirmed', label: 'Order confirmed' },
  { key: 'in_production', label: 'In production' },
  { key: 'qc_passed', label: 'QC inspection passed' },
  { key: 'shipped', label: 'Shipped / on vessel' },
  { key: 'customs', label: 'Destination customs' },
  { key: 'delivered', label: 'Delivered' },
] as const;

export type OrderStatus = (typeof ORDER_FLOW)[number]['key'];
export const ORDER_STATUSES = ORDER_FLOW.map((s) => s.key) as [OrderStatus, ...OrderStatus[]];

/** Which partner moves an order into each status (admins may set any status). */
export const STATUS_OWNER: Partial<Record<OrderStatus, Extract<Role, 'vendor' | 'logistics'>>> = {
  in_production: 'vendor',
  qc_passed: 'vendor',
  shipped: 'logistics',
  customs: 'logistics',
  delivered: 'logistics',
};

export const INCOTERMS = ['EXW', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'] as const;
export type Incoterm = (typeof INCOTERMS)[number];

export const statusIndex = (s: string) => ORDER_STATUSES.indexOf(s as OrderStatus);
export const statusLabel = (s: string) => ORDER_FLOW.find((x) => x.key === s)?.label ?? s;
export const nextStatus = (s: string): OrderStatus | undefined => ORDER_STATUSES[statusIndex(s) + 1];
/** True once the order has reached (or passed) the given milestone. */
export const hasReached = (current: string, milestone: OrderStatus) => statusIndex(current) >= statusIndex(milestone);

export interface TransitionInput {
  role: Role;
  current: OrderStatus;
  next: OrderStatus;
  hasLogistics: boolean;
  advancePaid: boolean;
  balancePaid: boolean;
}

/**
 * Business rules for moving an order to a new milestone.
 * Returns an error message, or null when the move is allowed.
 */
export function checkTransition({ role, current, next, hasLogistics, advancePaid, balancePaid }: TransitionInput): string | null {
  if (next === 'confirmed') return 'Unknown status';
  const isAdmin = role === 'admin';
  if (!isAdmin && STATUS_OWNER[next] !== role) return 'This milestone is updated by another party';
  if (!isAdmin && statusIndex(next) !== statusIndex(current) + 1) return 'Milestones must be updated in order';
  if (STATUS_OWNER[next] === 'logistics' && !hasLogistics) return 'Assign a logistics partner first';
  if (!isAdmin && next === 'in_production' && !advancePaid) return 'Production starts once the advance payment is confirmed';
  if (!isAdmin && next === 'shipped' && !balancePaid) return 'Dispatch is released once the balance payment is confirmed';
  return null;
}

/** Order reference shown to customers, e.g. HBG-2026-0007. */
export const orderCode = (id: number, year = new Date().getFullYear()) => `HBG-${year}-${String(id).padStart(4, '0')}`;
