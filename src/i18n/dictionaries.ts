import 'server-only';
import type { Locale } from './config';
import type { Dictionary } from './translate';

const loaders: Record<Exclude<Locale, 'en'>, () => Promise<Dictionary>> = {
  es: () => import('./messages/es.json').then((m) => m.default),
  fr: () => import('./messages/fr.json').then((m) => m.default),
  de: () => import('./messages/de.json').then((m) => m.default),
  ar: () => import('./messages/ar.json').then((m) => m.default),
};

export async function loadDictionary(locale: Locale): Promise<Dictionary> {
  return locale === 'en' ? {} : loaders[locale]();
}
