'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { LOCALES, type Locale } from './config';
import { createTranslator, englishT, type Dictionary, type TFunction } from './translate';

interface I18nValue {
  locale: Locale;
  t: TFunction;
}

const I18nContext = createContext<I18nValue>({ locale: 'en', t: englishT });

/** Supplies the active dictionary (loaded on the server) to Client Components. */
export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dictionary; children: ReactNode }) {
  const value = useMemo(() => ({ locale, t: locale === 'en' ? englishT : createTranslator(dict, LOCALES[locale].intl) }), [locale, dict]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
export const useT = () => useContext(I18nContext).t;
