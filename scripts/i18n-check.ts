/**
 * Reports translation coverage for each language against src/i18n/strings.en.json.
 *   npm run i18n:check                 → report only
 *   npm run i18n:check -- --strict     → exit 1 if anything is missing (use in CI once translations are complete)
 *
 * Run `npm run i18n:extract` first after changing UI text.
 */
import { existsSync, readFileSync } from 'node:fs';
import { LOCALES } from '../src/i18n/config';

const strict = process.argv.includes('--strict');
const en: string[] = JSON.parse(readFileSync('src/i18n/strings.en.json', 'utf8'));
let problems = 0;

for (const locale of Object.keys(LOCALES).filter((l) => l !== 'en')) {
  const file = `src/i18n/messages/${locale}.json`;
  if (!existsSync(file)) {
    console.log(`${locale}: missing file ${file}`);
    problems++;
    continue;
  }
  const dict: Record<string, string> = JSON.parse(readFileSync(file, 'utf8'));
  const missing = en.filter((k) => typeof dict[k] !== 'string' || !dict[k]!.trim());
  const placeholders = en.filter(
    (k) => typeof dict[k] === 'string' && (k.match(/\{#\}/g) ?? []).length !== (dict[k]!.match(/\{#\}/g) ?? []).length,
  );
  const pct = Math.round(((en.length - missing.length) / en.length) * 100);
  console.log(`${locale}: ${en.length - missing.length}/${en.length} translated (${pct}%), ${placeholders.length} placeholder mismatches`);
  missing.slice(0, 10).forEach((k) => console.log(`   missing: ${JSON.stringify(k)}`));
  if (missing.length > 10) console.log(`   … and ${missing.length - 10} more`);
  placeholders.forEach((k) => console.log(`   {#} mismatch: ${JSON.stringify(k)} → ${JSON.stringify(dict[k])}`));
  problems += placeholders.length + (strict ? missing.length : 0);
}

process.exit(problems ? 1 : 0);
