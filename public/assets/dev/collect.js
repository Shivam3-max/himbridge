// Dev tool: collects visible UI strings from pages (run in the browser console while the server runs with I18N_COLLECT=1).
// Usage: const { crawl } = await import("/assets/dev/collect.js"); await crawl(["/", "/marketplace", ...]);
export const TOKEN = /\b\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}\b|\$?\d[\d,]*(?:\.\d+)?%?/g;
export function collect(doc) {
  const out = new Set();
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA']);
  const add = (s) => { if (!s) return; const c = s.trim().replace(/\s+/g, ' '); if (!c || !/[A-Za-z]{2}/.test(c)) return; out.add(c.replace(TOKEN, '{#}')); };
  const w = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) { const n = w.currentNode; if (SKIP.has(n.parentElement?.tagName?.toUpperCase())) continue; add(n.data); }
  doc.querySelectorAll('[placeholder],[title],[aria-label],[alt]').forEach((e) => ['placeholder', 'title', 'aria-label', 'alt'].forEach((a) => e.hasAttribute(a) && add(e.getAttribute(a))));
  doc.title.split(' — ').forEach(add);
  return [...out];
}
export async function crawl(urls, wait = 1600) {
  const all = new Set();
  for (const u of urls) {
    const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;left:0;top:0;width:1300px;height:900px;opacity:0;pointer-events:none';
    document.body.append(f);
    await new Promise((ok) => { f.onload = ok; f.src = u; });
    await new Promise((ok) => setTimeout(ok, wait));
    collect(f.contentDocument).forEach((s) => all.add(s));
    f.remove();
  }
  const r = await fetch('/api/dev/collect', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ strings: [...all] }) }).then((x) => x.json());
  return { pages: urls.length, found: all.size, total: r.total };
}
