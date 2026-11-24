// Validates public/assets/i18n/<lang>.json against tools/i18n/strings.en.json.
// Usage: node tools/i18n/check.mjs es [fr de ar]
import { readFileSync, existsSync } from 'node:fs';
const en = JSON.parse(readFileSync('tools/i18n/strings.en.json', 'utf8'));
let bad = 0;
for (const lang of process.argv.slice(2)) {
  const f = `public/assets/i18n/${lang}.json`;
  if (!existsSync(f)) { console.log(`${lang}: missing file`); bad++; continue; }
  let d; try { d = JSON.parse(readFileSync(f, 'utf8')); } catch (e) { console.log(`${lang}: invalid JSON — ${e.message}`); bad++; continue; }
  const missing = en.filter((k) => typeof d[k] !== 'string' || !d[k].trim());
  const ph = en.filter((k) => typeof d[k] === 'string' && (k.match(/\{#\}/g) || []).length !== (d[k].match(/\{#\}/g) || []).length);
  const extra = Object.keys(d).filter((k) => !en.includes(k));
  console.log(`${lang}: ${en.length - missing.length}/${en.length} translated, ${missing.length} missing, ${ph.length} placeholder mismatches, ${extra.length} unknown keys`);
  missing.slice(0, 15).forEach((k) => console.log('  missing:', JSON.stringify(k)));
  ph.slice(0, 15).forEach((k) => console.log('  {#} mismatch:', JSON.stringify(k), '→', JSON.stringify(d[k])));
  extra.slice(0, 10).forEach((k) => console.log('  unknown key:', JSON.stringify(k)));
  bad += missing.length + ph.length;
}
process.exit(bad ? 1 : 0);
