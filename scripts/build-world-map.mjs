// Builds public/assets/map/world-network.svg — the animated dot-matrix world map used on the homepage.
// Input: Natural Earth 1:110m countries (public domain) as TopoJSON from the `world-atlas` npm package.
// Usage: node tools/build-world-map.mjs path/to/countries-110m.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = process.argv[2];
if (!src) {
  console.error('Usage: node tools/build-world-map.mjs countries-110m.json');
  process.exit(1);
}
const topo = JSON.parse(readFileSync(src, 'utf8'));

// ---------- TopoJSON decode ----------
const {
  scale: [kx, ky],
  translate: [tx, ty],
} = topo.transform;
const arcs = topo.arcs.map((arc) => {
  let x = 0,
    y = 0;
  return arc.map(([dx, dy]) => [(x += dx) * kx + tx, (y += dy) * ky + ty]);
});
const ring = (ids) =>
  ids.flatMap((i, n) => {
    const a = i < 0 ? arcs[~i].slice().reverse() : arcs[i];
    return n ? a.slice(1) : a;
  });
const countries = topo.objects.countries.geometries.map((g) => ({
  id: String(g.id ?? '').padStart(3, '0'),
  name: g.properties?.name,
  polys: (g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : []).map((p) => p.map(ring)),
}));

// ---------- Equal Earth projection ----------
const A1 = 1.340264,
  A2 = -0.081106,
  A3 = 0.000893,
  A4 = 0.003796,
  M = Math.sqrt(3) / 2;
const W = 1000,
  LAT_TOP = 84,
  LAT_BOTTOM = -57;
function ee(lon, lat) {
  const l = (lon * Math.PI) / 180,
    t = Math.asin(M * Math.sin((lat * Math.PI) / 180));
  const t2 = t * t,
    t6 = t2 * t2 * t2;
  return [
    (2 * Math.sqrt(3) * l * Math.cos(t)) / (3 * (9 * A4 * t6 * t2 + 7 * A3 * t6 + 3 * A2 * t2 + A1)),
    t * (A4 * t6 * t2 + A3 * t6 + A2 * t2 + A1),
  ];
}
const xMax = ee(180, 0)[0],
  yTop = ee(0, LAT_TOP)[1],
  yBot = ee(0, LAT_BOTTOM)[1];
const S = W / (2 * xMax),
  H = Math.round((yTop - yBot) * S);
const P = (lon, lat) => {
  const [x, y] = ee(lon, lat);
  return [(x + xMax) * S, (yTop - y) * S];
};

// ---------- rasterise land into a hex dot grid ----------
const proj = countries.map((c) => ({ ...c, polys: c.polys.map((p) => p.map((r) => r.map(([lo, la]) => P(lo, la)))) }));
for (const c of proj) {
  c.bbox = [Infinity, Infinity, -Infinity, -Infinity];
  for (const p of c.polys)
    for (const [x, y] of p[0]) {
      c.bbox[0] = Math.min(c.bbox[0], x);
      c.bbox[1] = Math.min(c.bbox[1], y);
      c.bbox[2] = Math.max(c.bbox[2], x);
      c.bbox[3] = Math.max(c.bbox[3], y);
    }
}
const inRing = (x, y, r) => {
  let o = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i],
      [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) o = !o;
  }
  return o;
};
const inPoly = (x, y, p) => inRing(x, y, p[0]) && !p.slice(1).some((h) => inRing(x, y, h));
const countryAt = (x, y) =>
  proj.find((c) => x >= c.bbox[0] && x <= c.bbox[2] && y >= c.bbox[1] && y <= c.bbox[3] && c.polys.some((p) => inPoly(x, y, p)));

// Markets we serve (ISO numeric) — drawn darker
const MARKET_IDS = new Set([
  '840',
  '124',
  '076',
  '826',
  '276',
  '528',
  '250',
  '380',
  '724',
  '056',
  '784',
  '682',
  '634',
  '414',
  '566',
  '404',
  '710',
  '036',
  '554',
  '702',
]);
const STEP = 6.2,
  dots = { land: [], market: [] };
for (let row = 0, y = STEP / 2; y < H; row++, y += STEP * 0.866) {
  for (let x = (row % 2 ? STEP / 2 : 0) + STEP / 2; x < W; x += STEP) {
    const c = countryAt(x, y);
    if (c && c.id !== '010') (MARKET_IDS.has(c.id) ? dots.market : dots.land).push([x, y]);
  }
}
const dotPath = (pts) => pts.map(([x, y]) => `M${x.toFixed(1)} ${y.toFixed(1)}h0`).join('');

// ---------- hubs, markets and lanes ----------
const HUBS = [P(78.5, 22.5), P(113.5, 28.5)];
const MARKETS = [
  { n: 'United States', at: [-96, 39], hub: 1, lx: -10, ly: -12, anchor: 'end', days: '28–35' },
  { n: 'Canada', at: [-96, 56], hub: 1, lx: 0, ly: -10, anchor: 'middle', days: '30–38' },
  { n: 'Brazil', at: [-50, -12], hub: 0, lx: -8, ly: 4, anchor: 'end', days: '32–40' },
  { n: 'United Kingdom', at: [-2, 53], hub: 0, lx: -9, ly: -4, anchor: 'end', days: '24–30' },
  { n: 'European Union', at: [9, 49.5], hub: 1, lx: 9, ly: 15, anchor: 'start', days: '26–32' },
  { n: 'UAE / GCC', at: [52, 24.5], hub: 0, lx: -2, ly: 16, anchor: 'end', days: '6–10' },
  { n: 'West Africa', at: [7, 9], hub: 1, lx: -9, ly: 4, anchor: 'end', days: '30–36' },
  { n: 'East Africa', at: [37.5, -1], hub: 0, lx: 9, ly: 8, anchor: 'start', days: '14–18' },
  { n: 'South Africa', at: [25, -29], hub: 1, lx: -9, ly: 4, anchor: 'end', days: '22–28' },
  { n: 'Australia', at: [135, -25], hub: 0, lx: 0, ly: 18, anchor: 'middle', days: '18–24' },
  { n: 'New Zealand', at: [174, -40.5], hub: 1, lx: -9, ly: 4, anchor: 'end', days: '20–26' },
];
const qLen = (a, c, b) => {
  let L = 0,
    px = a[0],
    py = a[1];
  for (let i = 1; i <= 40; i++) {
    const t = i / 40,
      u = 1 - t;
    const x = u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
      y = u * u * a[1] + 2 * u * t * c[1] + t * t * b[1];
    L += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return L;
};
const lanes = MARKETS.map((m, i) => {
  const a = HUBS[m.hub],
    b = P(...m.at);
  const mx = (a[0] + b[0]) / 2,
    my = (a[1] + b[1]) / 2,
    dx = b[0] - a[0],
    dy = b[1] - a[1],
    d = Math.hypot(dx, dy);
  let nx = -dy / d,
    ny = dx / d;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  } // bow towards north
  const k = Math.min(0.32 * d, 150),
    c = [mx + nx * k, my + ny * k];
  const len = qLen(a, c, b),
    dur = (2.6 + len / 260).toFixed(2),
    begin = (i * 0.55).toFixed(2);
  return {
    ...m,
    a,
    b,
    c,
    len,
    dur,
    begin,
    d: `M${a[0].toFixed(1)} ${a[1].toFixed(1)}Q${c[0].toFixed(1)} ${c[1].toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`,
  };
});

// graticule (every 30°)
const grat = [];
for (let lat = -30; lat <= 60; lat += 30) {
  const pts = [];
  for (let lon = -180; lon <= 180; lon += 5) pts.push(P(lon, lat));
  grat.push(pts);
}
for (let lon = -150; lon <= 180; lon += 30) {
  const pts = [];
  for (let lat = LAT_BOTTOM; lat <= LAT_TOP; lat += 3) pts.push(P(lon, lat));
  grat.push(pts);
}
const line = (pts) => 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L');
const outline = [];
for (let lat = LAT_BOTTOM; lat <= LAT_TOP; lat += 2) outline.push(P(-180, lat));
for (let lat = LAT_TOP; lat >= LAT_BOTTOM; lat -= 2) outline.push(P(180, lat));

const f = (n) => n.toFixed(1);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="world-net" role="img" aria-labelledby="wn-t wn-d">
<title id="wn-t">Himbridge global trade network</title>
<desc id="wn-d">World map with live trade lanes from Himbridge sourcing hubs to ${MARKETS.length} buyer regions.</desc>
<defs>
  <linearGradient id="wn-lane" x1="0" x2="1"><stop offset="0" stop-color="#f08a00"/><stop offset="1" stop-color="#0b2a5b"/></linearGradient>
  <radialGradient id="wn-glow"><stop offset="0" stop-color="#f08a00" stop-opacity=".45"/><stop offset="1" stop-color="#f08a00" stop-opacity="0"/></radialGradient>
  <filter id="wn-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6"/></filter>
</defs>
<path d="${line(outline)}Z" fill="#f7f9fc" stroke="#e3e9f2" stroke-width="1"/>
<path d="${grat.map(line).join('')}" fill="none" stroke="#e8edf4" stroke-width=".8"/>
<path d="${line([P(-180, 0), P(180, 0)])}" fill="none" stroke="#d9e1ec" stroke-width=".9" stroke-dasharray="3 5"/>
<path class="wn-land" d="${dotPath(dots.land)}" stroke="#c3cfdf" stroke-width="3.1" stroke-linecap="round"/>
<path class="wn-market" d="${dotPath(dots.market)}" stroke="#7f97b8" stroke-width="3.3" stroke-linecap="round"/>
<g class="wn-lanes" fill="none">
${lanes
  .map(
    (l, i) => `  <path id="wn-l${i}" d="${l.d}" stroke="url(#wn-lane)" stroke-opacity=".28" stroke-width="1.3" stroke-dasharray="2 4"/>
  <path d="${l.d}" stroke="#f08a00" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="${f(l.len * 0.22)} ${f(l.len * 1.3)}" stroke-dashoffset="${f(l.len * 0.22)}">
    <animate attributeName="stroke-dashoffset" values="${f(l.len * 0.22)};${f(-l.len)}" dur="${l.dur}s" begin="${l.begin}s" repeatCount="indefinite"/></path>
  <circle r="3.2" fill="#fff" stroke="#f08a00" stroke-width="2" opacity="0">
    <animateMotion dur="${l.dur}s" begin="${l.begin}s" repeatCount="indefinite" path="${l.d}"/>
    <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.06;.9;1" dur="${l.dur}s" begin="${l.begin}s" repeatCount="indefinite"/></circle>`,
  )
  .join('\n')}
</g>
<g class="wn-markets" font-family="'Noto Sans', Arial, sans-serif">
${lanes
  .map(
    (l) => `  <g class="wn-m" tabindex="0"><title>${l.n} — indicative sea transit ${l.days} days</title>
    <circle cx="${f(l.b[0])}" cy="${f(l.b[1])}" r="4" fill="none" stroke="#0b2a5b" stroke-width="1.5" opacity="0">
      <animate attributeName="r" values="4;4;16" keyTimes="0;.86;1" dur="${l.dur}s" begin="${l.begin}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0;0;.8;0" keyTimes="0;.86;.88;1" dur="${l.dur}s" begin="${l.begin}s" repeatCount="indefinite"/></circle>
    <circle cx="${f(l.b[0])}" cy="${f(l.b[1])}" r="4.6" fill="#0b2a5b" stroke="#fff" stroke-width="1.8"/>
    <text x="${f(l.b[0] + l.lx)}" y="${f(l.b[1] + l.ly)}" text-anchor="${l.anchor}" font-size="14.5" font-weight="700" fill="#0b2a5b" paint-order="stroke" stroke="#fff" stroke-width="3.2" stroke-linejoin="round">${l.n}</text>
  </g>`,
  )
  .join('\n')}
</g>
<g class="wn-hubs">
${HUBS.map(
  ([x, y], i) => `  <circle cx="${f(x)}" cy="${f(y)}" r="30" fill="url(#wn-glow)"/>
  <circle cx="${f(x)}" cy="${f(y)}" r="7" fill="none" stroke="#f08a00" stroke-width="1.6"><animate attributeName="r" values="7;22" dur="2.4s" begin="${i * 1.2}s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0" dur="2.4s" begin="${i * 1.2}s" repeatCount="indefinite"/></circle>
  <rect x="${f(x - 8)}" y="${f(y - 8)}" width="16" height="16" rx="4" fill="#0b2a5b" stroke="#fff" stroke-width="1.6"/>
  <path d="M${f(x - 3.6)} ${f(y + 3)}L${f(x)} ${f(y - 4)}L${f(x + 3.6)} ${f(y + 3)}Z" fill="#f08a00"/>`,
).join('\n')}
  <text x="${f((HUBS[0][0] + HUBS[1][0]) / 2)}" y="${f(Math.max(HUBS[0][1], HUBS[1][1]) + 30)}" text-anchor="middle" font-family="'Noto Sans', Arial, sans-serif" font-size="12.5" font-weight="800" letter-spacing="1.8" fill="#b56700" paint-order="stroke" stroke="#fff" stroke-width="3.2">HIMBRIDGE SOURCING HUBS</text>
</g>
</svg>
`;
mkdirSync(join(root, 'public/assets/map'), { recursive: true });
writeFileSync(join(root, 'public/assets/map/world-network.svg'), svg);
writeFileSync(
  join(root, 'public/assets/map/ATTRIBUTION.txt'),
  'Land outlines: Natural Earth 1:110m (public domain), via the world-atlas npm package (ISC).\nGenerated by tools/build-world-map.mjs — rerun it to change markets, lanes or styling.\n',
);
console.log(
  `world-network.svg ${W}x${H}: ${dots.land.length + dots.market.length} dots, ${lanes.length} lanes, ${(svg.length / 1024).toFixed(0)} KB`,
);
