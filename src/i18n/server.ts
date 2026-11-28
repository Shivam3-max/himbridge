import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, LOCALES, type Locale } from './config';
import { loadDictionary } from './dictionaries';
import { createTranslator, englishT } from './translate';

export const getLocale = cache(async (): Promise<Locale> => {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
});

/** Translator for Server Components, server actions and route handlers. */
export const getI18n = cache(async () => {
  const locale = await getLocale();
  const dict = await loadDictionary(locale);
  const t = locale === 'en' ? englishT : createTranslator(dict, LOCALES[locale].intl);
  return { locale, dict, t, intl: LOCALES[locale].intl, rtl: LOCALES[locale].rtl };
});
