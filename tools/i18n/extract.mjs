// Builds tools/i18n/strings.en.json: UI strings collected from rendered pages (data/i18n-collected.json)
// plus messages from source (API errors, toasts, confirms), minus database content (company/product names etc.).
import { readFileSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
const TOKEN = /\b\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}\b|\$?\d[\d,]*(?:\.\d+)?%?/g;
const norm = (s) => s.trim().replace(/\s+/g, ' ').replace(TOKEN, '{#}');
const set = new Set(JSON.parse(readFileSync('data/i18n-collected.json', 'utf8')));
// messages that only appear after an action
const src = ['server/server.js', 'public/assets/dashboard.js', 'public/assets/app.js', ...['register', 'login', 'forgot-password', 'reset-password', 'verify-email', 'tools', 'track', 'marketplace', 'document', 'index'].map((p) => `public/${p}.html`)]
  .map((f) => readFileSync(f, 'utf8')).join('\n');
for (const re of [/fail\(\d+, '([^']+)'\)/g, /toast\('([^']+)'/g, /showMsg\([^,]+, '([^']+)'/g, /confirm\('([^']+)'\)/g, /Error\('([^']+)'\)/g]) for (const m of src.matchAll(re)) set.add(norm(m[1]));
// database content is user data, not UI — keep it out of the dictionary
const db = new DatabaseSync('data/himbridge.db');
const dbVals = new Set();
for (const [t, cols] of [['users', 'name,company,email'], ['vendors', 'cluster,certifications,capacity,about'], ['products', 'title,description,material'], ['rfqs', 'title,details,destination'], ['quotes', 'note'], ['orders', 'title,destination,mode,origin_port,dest_port'], ['milestones', 'note'], ['notices', 'title,body']])
  for (const r of db.prepare(`SELECT ${cols} FROM ${t}`).all()) for (const v of Object.values(r)) if (typeof v === 'string' && v.trim()) dbVals.add(norm(v));
const isData = (s) => dbVals.has(s) || [...dbVals].some((v) => v.length > 12 && s.includes(v));
const out = [...set].filter((s) => /[A-Za-z]{2}/.test(s.replace(/\{#\}/g, '')) && !/HBG-|@|^https?:|\.(svg|png|jpg)$/.test(s) && !isData(s)).sort();
writeFileSync('tools/i18n/strings.en.json', JSON.stringify(out, null, 1) + '\n');
console.log(`collected ${set.size}, kept ${out.length}, dropped ${set.size - out.length} (data / codes)`);
