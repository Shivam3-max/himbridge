/** Display helpers shared by server and client components. Formatting is fixed to en-US numbers so the
 *  translator can match them as {#} tokens; dates use "02 Mar 2026" for the same reason. */

export const usd = (n: number | null | undefined, digits = 2) =>
  n == null || Number.isNaN(n)
    ? '—'
    : `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

export const fmtNum = (n: number | null | undefined) => Number(n ?? 0).toLocaleString('en-US');

export const fmtDate = (d: Date | string | null | undefined) => {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
};

export const initials = (name: string) =>
  name
    .replace(/&/g, '')
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

/** "pcs" → "pc", "sets" → "set" (for "/ pc FOB"). */
export const singularUnit = (unit: string) => unit.replace(/s$/, '');

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');
