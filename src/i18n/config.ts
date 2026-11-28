export const LOCALES = {
  en: { label: 'English', intl: 'en-GB', rtl: false },
  es: { label: 'Español', intl: 'es-ES', rtl: false },
  fr: { label: 'Français', intl: 'fr-FR', rtl: false },
  de: { label: 'Deutsch', intl: 'de-DE', rtl: false },
  ar: { label: 'العربية', intl: 'ar-u-nu-latn', rtl: true },
} as const;

export type Locale = keyof typeof LOCALES;
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'hbg-lang';

export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && v in LOCALES;
