// Shared portal shell: header, nav, ticker, footer, API + helpers.
export const BRAND = { name: 'Himbridge', full: 'Himbridge Global Trade Portal', tagline: 'Verified Sourcing · Export to the World', helpline: '+91 11 4000 0000', email: 'helpdesk@himbridge.trade' };

export async function api(path, opts = {}) {
  const res = await fetch(path, {
    method: opts.method || (opts.body ? 'POST' : 'GET'),
    headers: opts.body ? { 'Content-Type': 'application/json' } : {},
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const usd = (n, d = 2) => (n == null ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }));
export const fmtNum = (n) => Number(n || 0).toLocaleString('en-US');
export const fmtDate = (s) => (s ? new Date(s.replace(' ', 'T') + 'Z').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '');
// Public positioning: products are grouped into two Himbridge collections rather than by country.
// The country of origin stays in the data (customs paperwork needs it) but is not used as a selling point.
export const COLLECTIONS = { IN: { key: 'crafted', name: 'Crafted', blurb: 'Handmade, artisanal & natural-material goods' }, CN: { key: 'engineered', name: 'Engineered', blurb: 'Lighting, solar, appliances & modern furniture at scale' } };
export const collectionName = (o) => COLLECTIONS[o]?.name || 'Any collection';
export const collectionFromKey = (k) => Object.keys(COLLECTIONS).find((o) => COLLECTIONS[o].key === k) || '';
export const collectionChip = (o) => (COLLECTIONS[o] ? `<span class="chip ${COLLECTIONS[o].key}"><span class="dot"></span>${COLLECTIONS[o].name}</span>` : '<span class="chip any"><span class="dot"></span>Any collection</span>');
export const originChip = collectionChip; // backwards-compatible name
export const initials = (name) => name.replace(/&/g, '').split(/[\s,]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
export const qs = (s, el = document) => el.querySelector(s);
export const qsa = (s, el = document) => [...el.querySelectorAll(s)];

let metaP, meP;
export const getMeta = () => (metaP ||= api('/api/meta'));
export const getMe = () => (meP ||= api('/api/me').then((r) => r.user).catch(() => null));
export async function nicheMap() { const m = await getMeta(); return Object.fromEntries(m.niches.map((n) => [n.slug, n])); }

export function toast(msg, isErr = false) {
  let t = qs('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.textContent = msg; t.classList.toggle('err', isErr); t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 3200);
}

export function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}
export function showMsg(el, text, ok = false) {
  el.textContent = text; el.className = `form-msg show ${ok ? 'ok' : 'err'}`;
}

// ---------- file uploads ----------
export const ACCEPT_DOCS = 'image/jpeg,image/png,image/webp,application/pdf';
export const ACCEPT_IMAGES = 'image/jpeg,image/png,image/webp';
const readAsDataURL = (file) => new Promise((ok, bad) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => bad(new Error('Could not read file')); r.readAsDataURL(file); });
export async function uploadFile(file, { kind, ref_id = null, label = '' }) {
  if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name}: each file must be under 5 MB`);
  return api('/api/uploads', { body: { kind, ref_id, label, name: file.name, data: await readAsDataURL(file) } });
}
export async function uploadAll(files, opts) {
  const done = [];
  for (const f of files) done.push(await uploadFile(f, opts));
  return done;
}
export const fileSize = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
export function fileChip(f, { del = false } = {}) {
  const isImg = /^image\//.test(f.mime);
  return `<span class="fchip">${isImg ? `<img src="/files/${f.id}" alt="">` : '<span class="fic">PDF</span>'}<a href="/files/${f.id}" target="_blank" rel="noopener">${esc(f.label ? f.label + ' — ' : '')}${esc(f.name)}</a>${f.size ? `<span class="tiny muted">${fileSize(f.size)}</span>` : ''}${del ? `<button type="button" class="fdel" data-delfile="${f.id}" aria-label="Remove ${esc(f.name)}">×</button>` : ''}</span>`;
}
// Drop zone markup: <label class="dropzone"> with a hidden file input; pair with bindDropzones().
export function dropzone(name, { accept = ACCEPT_DOCS, multiple = true, hint = 'JPG, PNG, WEBP or PDF · max 5 MB each' } = {}) {
  return `<label class="dropzone"><input type="file" name="${name}" accept="${accept}" ${multiple ? 'multiple' : ''}>
    <span class="dz-ic">⇪</span><b>Choose files</b> or drag them here<span class="tiny muted">${hint}</span><span class="dz-list tiny"></span></label>`;
}
export function bindDropzones(root = document) {
  root.querySelectorAll('.dropzone').forEach((dz) => {
    const input = dz.querySelector('input'), list = dz.querySelector('.dz-list');
    const show = () => { list.textContent = [...input.files].map((f) => `${f.name} (${fileSize(f.size)})`).join(' · '); dz.classList.toggle('has', input.files.length > 0); };
    input.onchange = show;
    dz.ondragover = (e) => { e.preventDefault(); dz.classList.add('over'); };
    dz.ondragleave = () => dz.classList.remove('over');
    dz.ondrop = (e) => { e.preventDefault(); dz.classList.remove('over'); input.files = e.dataTransfer.files; show(); };
  });
}

// Image placeholder — replace with <img> once real photos/banners are available.
export const PH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/></svg>';
export function ph(label, size = '', cls = '', extra = '') {
  return `<div class="ph ${cls}" role="img" aria-label="${esc(label)} placeholder">${extra}<div class="ph-in">${PH_ICON}<b>${esc(label)}</b>${size ? `<code>${esc(size)}</code>` : ''}</div></div>`;
}
// Small saffron peak — the logo's mountain, used as the kicker mark on banners.
export const PEAK = '<svg class="peak" viewBox="0 0 20 12" aria-hidden="true"><path d="M0 12 L10 0 L20 12 Z" fill="currentColor"/><path d="M10 0 L7.4 3.1 L8.8 2.4 L10 3.6 L11.3 2.4 L12.6 3.1 Z" fill="#fff"/></svg>';
// Designed page banner: photo + navy gradient + kicker + one-line statement. Falls back to a placeholder without an image.
export function pageBanner(label, opts = {}) {
  if (!opts.img) return ph(label, 'Page banner · 1600 × 300', 'page-banner');
  return `<section class="pb" aria-label="${esc(opts.kicker || label)}">
    <img src="${esc(opts.img)}" alt="" style="object-position:${opts.pos || 'center'}" fetchpriority="high">
    <div class="wrap pb-in"><span class="kicker">${PEAK}${esc(opts.kicker)}</span><p class="pb-line">${esc(opts.line)}</p></div>
  </section>`;
}

export function productCard(p, niches) {
  const n = niches[p.niche] || { name: p.niche, color: '#0b2a5b' };
  return `<article class="pcard" style="--c:${n.color}">
    ${p.image ? `<div class="pthumb">${collectionChip(p.origin)}<img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy"></div>` : ph('Product image', '800 × 600', 'pthumb', collectionChip(p.origin))}
    <div class="pbody">
      <span class="tiny muted">${esc(n.name)} · HS ${esc(p.hs_code || '—')}</span>
      <h4>${esc(p.title)}</h4>
      <div class="price">${usd(p.price_min)} – ${usd(p.price_max)} <span class="tiny muted">/ ${esc(p.unit.replace(/s$/, ''))} FOB</span></div>
      <div class="pmeta"><span>MOQ <b>${fmtNum(p.moq)} ${esc(p.unit)}</b></span><span>Lead <b>${p.lead_days} days</b></span>
      <span style="grid-column:1/-1">Material <b>${esc(p.material || '—')}</b></span></div>
      <div class="pvendor">✔ <b>${esc(p.vendor_company)}</b><br>${esc(p.cluster || '')}</div>
      <a class="btn sm ghost" href="/dashboard#post-rfq?niche=${encodeURIComponent(p.niche)}&title=${encodeURIComponent(p.title)}">Request quotation</a>
    </div></article>`;
}

const LOGO = `<svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#0b2a5b"/>
<path d="M13 13.5 Q13 12 14.5 12 H20.5 Q22 12 22 13.5 V52 H13 Z" fill="#fff"/><path d="M42 13.5 Q42 12 43.5 12 H49.5 Q51 12 51 13.5 V52 H42 Z" fill="#fff"/>
<path d="M22 35 L32 16 L42 35 Z" fill="#f08a00"/><path d="M32 16 L27.3 24.9 L29.8 23.4 L32 25.4 L34.3 23.4 L36.7 24.9 Z" fill="#fff"/>
<rect x="13" y="35" width="38" height="5.5" fill="#fff"/><path d="M22 52 Q32 42.5 42 52" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>`;

const NAV = [
  ['/', 'Home'], ['/marketplace', 'Marketplace'], ['/niches', 'Niches & Research'], ['/vendors', 'Vendor Directory'],
  ['/dashboard#post-rfq', 'Post RFQ'], ['/track', 'Track Shipment'], ['/tools', 'Trade Tools'], ['/about', 'About Himbridge'],
];

// ---------- Language switcher ----------
// Whole-site translation. Dictionaries live in /assets/i18n/<lang>.json and map the English UI text to the
// translation. Numbers, prices and dates inside a string are matched as {#} placeholders. Text that is not in
// the dictionary (company names, product titles, user input) is left as it is. Regenerate the English string list
// with tools/i18n/ (see README) when you add new UI copy.
export const LANGS = {
  en: { label: 'English', locale: 'en-GB' }, es: { label: 'Español', locale: 'es-ES' }, fr: { label: 'Français', locale: 'fr-FR' },
  de: { label: 'Deutsch', locale: 'de-DE' }, ar: { label: 'العربية', locale: 'ar-u-nu-latn', rtl: true },
};
export const LANG = (() => { try { const l = localStorage.getItem('hbg-lang'); return LANGS[l] ? l : 'en'; } catch { return 'en'; } })();
document.documentElement.lang = LANG;
if (LANGS[LANG].rtl) document.documentElement.dir = 'rtl';
const DICT = LANG === 'en' ? {} : await fetch(`/assets/i18n/${LANG}.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
const TOKEN = /\b\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}\b|\$?\d[\d,]*(?:\.\d+)?%?/g;
const IS_DATE = /^\d{1,2} [A-Z][a-z]{2} \d{4}$/;
const localDate = (s) => { const d = new Date(s + ' UTC'); return isNaN(d) ? s : d.toLocaleDateString(LANGS[LANG].locale, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }); };
export function tr(text) {
  if (LANG === 'en' || !text || !/[A-Za-z]/.test(text)) return text;
  const lead = text.match(/^\s*/)[0], trail = text.match(/\s*$/)[0];
  const core = text.trim().replace(/\s+/g, ' ');
  let out = DICT[core];
  if (out == null) {
    const tokens = core.match(TOKEN);
    if (tokens) { const tpl = DICT[core.replace(TOKEN, '{#}')]; if (tpl != null) { let i = 0; out = tpl.replace(/\{#\}/g, () => { const tk = tokens[i++] ?? ''; return IS_DATE.test(tk) ? localDate(tk) : tk; }); } }
  }
  return out == null ? text : lead + out + trail;
}
export const t = (key, fallback = '') => tr(fallback || key);
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA']);
const skip = (el) => !el || SKIP.has(el.tagName?.toUpperCase()) || el.closest?.('[translate="no"]');
function trText(n) { if (skip(n.parentElement)) return; const v = tr(n.data); if (v !== n.data) n.data = v; }
function trAttrs(el) { for (const a of ATTRS) { const v = el.getAttribute?.(a); if (v) { const x = tr(v); if (x !== v) el.setAttribute(a, x); } } }
export function translate(root = document.body) {
  if (LANG === 'en' || !root) return;
  if (root.nodeType === 3) return trText(root);
  if (root.nodeType !== 1 && root.nodeType !== 9) return;
  const base = root.nodeType === 9 ? root.body : root;
  if (!base || skip(base)) return;
  const w = document.createTreeWalker(base, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) trText(w.currentNode);
  trAttrs(base); base.querySelectorAll('[placeholder],[title],[aria-label],[alt]').forEach(trAttrs);
}
if (LANG !== 'en') {
  translate(document.body);
  document.title = document.title.split(' — ').map(tr).join(' — ');
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'characterData') trText(m.target);
      else if (m.type === 'attributes') trAttrs(m.target);
      else m.addedNodes.forEach((n) => translate(n));
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  const oc = window.confirm.bind(window), oa = window.alert.bind(window);
  window.confirm = (m) => oc(tr(String(m))); window.alert = (m) => oa(tr(String(m)));
}
document.documentElement.style.visibility = ''; // pages hide themselves until the dictionary is applied

async function renderShell() {
  const here = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/') || '/';
  const header = qs('#site-header');
  if (header) {
    header.innerHTML = `<a class="skip" href="#main">Skip to main content</a>
    <div class="util"><div class="wrap">
      <div class="util-l"><span data-i18n="util">Global Sourcing &amp; Export Platform</span><span class="sep"></span><span data-i18n="util2">Verified · Inspected · Delivered</span></div>
      <div class="util-r">
        <a href="#main">Skip to main content</a><span class="sep"></span>
        <span class="fs-btns" aria-label="Text size"><button data-fs="13">A-</button> <button data-fs="15">A</button> <button data-fs="17">A+</button></span><span class="sep"></span>
        <select aria-label="Language" id="lang">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}" ${k === LANG ? 'selected' : ''}>${v.label}</option>`).join('')}</select><span class="sep"></span>
        <span><span data-i18n="helpdesk">Help desk</span>: <b dir="ltr">${BRAND.helpline}</b></span>
      </div></div></div>
    <div class="band"></div>
    <div class="brand-row"><div class="wrap">
      <a class="brand" href="/">${LOGO}<div><div class="brand-name">${BRAND.name}</div><div class="brand-tag" data-i18n="portal">Global Trade Portal</div><div class="brand-sub" data-i18n="brandsub">Verified manufacturers · Delivered worldwide</div></div></a>
      <div class="brand-tools">
        <form class="search" action="/marketplace" role="search"><input name="q" placeholder="Search products, vendors, HS codes…" data-i18n-ph="search" aria-label="Search"><button aria-label="Search">⌕</button></form>
        <div class="brand-partners"><div class="seal"><b>KYC</b>Verified</div><div class="seal"><b>QC</b>Inspected</div><div class="seal"><b>Door</b>to Door</div></div>
      </div></div></div>
    <nav class="nav" aria-label="Main"><div class="wrap">
      <button class="nav-toggle" aria-label="Menu">☰</button>
      <ul>${NAV.map(([h, l], i) => `<li><a href="${h}" class="${h === here ? 'active' : ''}" data-i18n="nav${i}">${l}</a></li>`).join('')}</ul>
      <div class="nav-user" id="nav-user"></div>
    </div></nav>
    <div class="ticker"><div class="wrap"><span class="ticker-label" data-i18n="whatsnew">What's New</span><div class="ticker-track"><div class="ticker-inner" id="ticker"></div></div></div></div>`;

    qs('#lang').onchange = (e) => { try { localStorage.setItem('hbg-lang', e.target.value); } catch {} location.reload(); };
    qs('.nav-toggle').onclick = () => qs('.nav').classList.toggle('open');
    qsa('[data-fs]').forEach((b) => (b.onclick = () => { document.documentElement.style.setProperty('--fs', b.dataset.fs + 'px'); try { localStorage.setItem('hbg-fs', b.dataset.fs); } catch {} }));
    try { const fs = localStorage.getItem('hbg-fs'); if (fs) document.documentElement.style.setProperty('--fs', fs + 'px'); } catch {}

    api('/api/notices').then((ns) => {
      const items = ns.slice(0, 6).map((n) => `<span>${esc(n.title)}</span>`).join('');
      qs('#ticker').innerHTML = items + items;
    }).catch(() => {});

    getMe().then((u) => {
      const box = qs('#nav-user');
      if (u) {
        box.innerHTML = `<a class="btn sm saffron" href="/dashboard" data-i18n="mydash">My Dashboard</a><button class="btn sm ghost" id="logout" data-i18n="logout">Logout</button>`;
        qs('#logout').onclick = async () => { await api('/api/logout', { method: 'POST', body: {} }); location.href = '/'; };
      } else {
        box.innerHTML = `<a class="btn sm ghost" href="/login" data-i18n="login">Login</a><a class="btn sm saffron" href="/register" data-i18n="register">Register</a>`;
      }

    });
  }

  const footer = qs('#site-footer');
  if (footer) {
    footer.innerHTML = `<footer class="footer"><div class="wrap footer-cols">
      <div><a class="brand" href="/">${LOGO}<div><div class="brand-name" style="font-size:1.35rem">${BRAND.name}</div><div class="brand-tag">Global Trade Portal</div></div></a>
        <p class="small muted" style="margin-top:12px" data-i18n="footabout">One trusted desk for verified manufacturers, quality inspection, export documentation and door-to-door logistics.</p>
        <p class="small"><b>Help desk:</b> ${BRAND.helpline}<br><b>Email:</b> ${BRAND.email}<br><span class="muted">Mon–Sat, 09:30–18:30 IST</span></p></div>
      <div><h4 data-i18n="fbuyers">For Buyers</h4><ul><li><a href="/marketplace">Browse marketplace</a></li><li><a href="/dashboard#post-rfq">Post an RFQ</a></li><li><a href="/track">Track shipment</a></li><li><a href="/tools#landed">Landed cost calculator</a></li><li><a href="/register?role=buyer">Buyer registration</a></li></ul></div>
      <div><h4 data-i18n="fvendors">For Vendors</h4><ul><li><a href="/register?role=vendor">Vendor registration</a></li><li><a href="/niches">Niche opportunities</a></li><li><a href="/tools#docs">Export documents</a></li><li><a href="/about#verification">Verification process</a></li><li><a href="/about#programme">Founding Vendor Programme</a></li></ul></div>
      <div><h4 data-i18n="fpartners">Partners</h4><ul><li><a href="/register?role=logistics">Logistics partner sign-up</a></li><li><a href="/about#ecosystem">Ecosystem</a></li><li><a href="/tools#incoterms">Incoterms guide</a></li><li><a href="/tools#hs">HS code finder</a></li></ul></div>
      <div><h4 data-i18n="fportal">Portal</h4><ul><li><a href="/about">About Himbridge</a></li><li><a href="/about#revenue">Business model</a></li><li><a href="/login">Login</a></li><li><a href="/about#policies">Terms &amp; privacy</a></li></ul></div>
    </div>
    <div class="footer-bottom"><div class="wrap"><span>© ${new Date().getFullYear()} ${BRAND.full}. <span data-i18n="rights">All rights reserved.</span></span><span>Last updated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · Best viewed in latest Chrome, Safari, Edge</span></div></div></footer>`;
  }
}

renderShell();

// Order milestone timeline shared by tracking page and dashboards.
export function timeline(order, flow) {
  const idx = flow.findIndex((s) => s.key === order.status);
  const byStatus = Object.fromEntries((order.milestones || []).map((m) => [m.status, m]));
  return `<ul class="timeline">${flow.map((s, i) => {
    const m = byStatus[s.key];
    const cls = i < idx ? 'done' : i === idx ? (i === flow.length - 1 ? 'done' : 'current') : '';
    return `<li class="${cls}"><span class="dotc">${i <= idx ? '✓' : ''}</span>
      <div class="tl-t">${esc(s.label)}</div>
      <div class="tl-n">${m ? `${fmtDate(m.created_at)}${m.by_company ? ' · ' + esc(m.by_company) : ''}${m.note ? ' — ' + esc(m.note) : ''}` : 'Pending'}</div></li>`;
  }).join('')}</ul>`;
}
export function progressBar(order, flow) {
  const idx = flow.findIndex((s) => s.key === order.status);
  return `<div class="progress">${flow.map((_, i) => `<i class="${i <= idx ? 'on' : ''}"></i>`).join('')}</div>`;
}
export function statusBadge(status, flow) {
  const s = flow.find((x) => x.key === status);
  const cls = status === 'delivered' ? 'ok' : status === 'confirmed' ? 'info' : 'warn';
  return `<span class="badge ${cls}">${esc(s ? s.label : status)}</span>`;
}
