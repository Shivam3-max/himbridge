/**
 * Lists every English UI string in the source code → src/i18n/strings.en.json.
 *   npm run i18n:extract
 *
 * Collected from:
 *  - t('…') / t("…") / t(`…`) calls (template expressions become {#}, matching how numbers are translated)
 *  - string literals in the "UI data" files below (menus, labels, category names…), which are translated where
 *    they are rendered.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { toTemplate } from '../src/i18n/translate';

const DATA_FILES = [
  'src/components/dashboard/menu.ts',
  'src/components/layout/site-header.tsx',
  'src/components/layout/site-footer.tsx',
  'src/domain/order-flow.ts',
  'src/domain/niches.ts',
  'src/domain/roles.ts',
  'src/domain/collections.ts',
  'src/domain/files.ts',
  'src/domain/payments.ts',
  'src/domain/trade-reference.ts',
];

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(p) ? [p] : [];
  });

const strings = new Set<string>();
const add = (s: string) => {
  const tpl = toTemplate(s);
  if (/[A-Za-z]{2}/.test(tpl.replace(/\{#\}/g, ''))) strings.add(tpl);
};

for (const file of walk('src')) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'\s*\)/g)) add(m[1]!.replace(/\\'/g, "'"));
  for (const m of src.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"\s*\)/g)) add(m[1]!);
  // Template literals: only when every interpolation stands alone (numbers, dates), e.g. t(`${n} products found`).
  for (const m of src.matchAll(/\bt\(\s*`((?:[^`\\]|\\.)*)`\s*\)/g)) {
    const tpl = m[1]!;
    if (/[A-Za-z]\$\{|\}[A-Za-z]/.test(tpl) || /\$\{[^}]*(LABEL|label|role|status|unit|name|owner)[^}]*\}/.test(tpl)) continue;
    add(tpl.replace(/\$\{[^}]*\}/g, '0'));
  }
  // Fixed text passed to self-translating components (<Empty>…</Empty>, <Badge>…</Badge>, <SubmitButton>…</SubmitButton>).
  for (const m of src.matchAll(/<(Empty|Badge|SubmitButton)[^>]*>\s*([A-Z][^<{]+?)\s*<\/\1>/g)) add(m[2]!);
}

for (const file of DATA_FILES) {
  const src = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  for (const m of src.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g)) {
    const s = (m[1] ?? m[2] ?? '').replace(/\\'/g, "'");
    // Skip identifiers, slugs, paths, codes and colours.
    if (/^[a-z0-9_.@/#-]*$/.test(s) || /^[A-Z]{2,5}$/.test(s) || s.startsWith('/') || s.startsWith('#') || s.startsWith('%')) continue;
    add(s);
  }
}

const out = [...strings].sort((a, b) => a.localeCompare(b));
writeFileSync('src/i18n/strings.en.json', `${JSON.stringify(out, null, 1)}\n`);
console.log(`Wrote ${out.length} UI strings to src/i18n/strings.en.json`);
