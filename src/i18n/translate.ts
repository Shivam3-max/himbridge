/**
 * Translation works like gettext: the English text *is* the key.
 *
 *   t('Export Marketplace')            → 'Mercado de exportación'
 *   t(`${count} products found`)       → numbers, prices and dates are matched as {#}
 *
 * Dictionaries live in src/i18n/messages/<locale>.json. Text without a translation stays in English,
 * and user content (company names, product titles…) is simply never passed through t().
 * `npm run i18n:extract` lists every t('…') string; `npm run i18n:check` reports missing translations.
 */
export type Dictionary = Record<string, string>;
export type TFunction = (text: string) => string;

/** Numbers, prices, percentages and "02 Mar 2026"-style dates inside a sentence. */
export const TOKEN = /\b\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}\b|\$?\d[\d,]*(?:\.\d+)?%?/g;
const IS_DATE = /^\d{1,2} [A-Z][a-z]{2} \d{4}$/;

export const normalize = (text: string) => text.trim().replace(/\s+/g, ' ');
export const toTemplate = (text: string) => normalize(text).replace(TOKEN, '{#}');

export function createTranslator(dict: Dictionary, intlLocale: string): TFunction {
  const localDate = (s: string) => {
    const d = new Date(`${s} UTC`);
    return Number.isNaN(d.getTime())
      ? s
      : d.toLocaleDateString(intlLocale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
  };
  return (text: string) => {
    if (!text || !/[A-Za-z]/.test(text)) return text;
    const core = normalize(text);
    const exact = dict[core];
    if (exact != null) return exact;
    const tokens = core.match(TOKEN);
    if (!tokens) return text;
    const tpl = dict[core.replace(TOKEN, '{#}')];
    if (tpl == null) return text;
    let i = 0;
    return tpl.replace(/\{#\}/g, () => {
      const tk = tokens[i++] ?? '';
      return IS_DATE.test(tk) ? localDate(tk) : tk;
    });
  };
}

/** Identity translator for English. */
export const englishT: TFunction = (text) => text;
