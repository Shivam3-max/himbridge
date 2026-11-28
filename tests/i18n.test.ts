import { describe, expect, it } from 'vitest';
import { createTranslator, toTemplate } from '@/i18n/translate';

const t = createTranslator(
  {
    'Export Marketplace': 'Mercado de exportación',
    '{#} products found': '{#} productos encontrados',
    'posted {#}': 'publicado {#}',
  },
  'es-ES',
);

describe('translator', () => {
  it('translates exact strings and leaves unknown text in English', () => {
    expect(t('Export Marketplace')).toBe('Mercado de exportación');
    expect(t('Carter Home Co.')).toBe('Carter Home Co.');
  });

  it('fills numbers into templates', () => {
    expect(t('12 products found')).toBe('12 productos encontrados');
  });

  it('localises dates inside sentences', () => {
    expect(t('posted 02 Mar 2026')).toBe('publicado 02 mar 2026');
  });

  it('builds templates the same way the extractor does', () => {
    expect(toTemplate('  Order  $27,120 total ')).toBe('Order {#} total');
  });
});
