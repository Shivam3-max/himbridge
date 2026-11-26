import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ProductCard } from '@/components/catalog/product-card';
import { HeroSlider } from '@/components/home/hero-slider';
import { NetworkMap } from '@/components/home/network-map';
import { Placeholder } from '@/components/ui/primitives';
import { sectorName } from '@/domain/sectors';
import { NICHES } from '@/domain/niches';
import { getI18n } from '@/i18n/server';
import { fmtNum, usd } from '@/lib/format';
import { listNotices } from '@/server/services/admin';
import { getStats, listProducts } from '@/server/services/catalog';

export const dynamic = 'force-dynamic';

const svgProps = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 } as const;
const TILES: [href: string, title: string, sub: string, icon: React.ReactNode][] = [
  [
    '/register?role=vendor',
    'Vendor Registration',
    'Onboard your factory',
    <svg key="v" {...svgProps}>
      <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" />
    </svg>,
  ],
  [
    '/dashboard/rfqs/new',
    'Post RFQ',
    'Get quotes in 48 hrs',
    <svg key="r" {...svgProps}>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6M8 13h8M8 17h5" />
    </svg>,
  ],
  [
    '/track',
    'Track Shipment',
    'Live milestones',
    <svg key="t" {...svgProps}>
      <path d="M2 17h20l-2 4H4zM5 17V9h14v8M9 9V5h6v4" />
    </svg>,
  ],
  [
    '/tools#landed',
    'Landed Cost',
    'Duty & freight estimate',
    <svg key="l" {...svgProps}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M8 18h8" />
    </svg>,
  ],
  [
    '/tools#hs',
    'HS Code Finder',
    'Classify your goods',
    <svg key="h" {...svgProps}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4M8 11h6M11 8v6" />
    </svg>,
  ],
  [
    '/tools#docs',
    'Export Documents',
    'Step-by-step checklist',
    <svg key="d" {...svgProps}>
      <path d="M9 11l3 3 8-8" />
      <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" />
    </svg>,
  ],
];

const STEPS: [string, string][] = [
  ['Post requirement', 'Buyer submits an RFQ with quantity, destination, target price and specifications.'],
  ['Matched quotes', 'Matched, verified manufacturers quote. Compare price, lead time and certifications side by side.'],
  ['Confirm & produce', 'Accept a quote — order is created with milestone payments and production tracking.'],
  ['QC & documents', 'Pre-shipment inspection (AQL), invoice, packing list, COO and export clearance.'],
  ['Ship & deliver', 'Freight partner books sea/air, updates milestones through destination customs to delivery.'],
];

const AUDIENCES: [title: string, tone: '' | 'saffron' | 'green', items: string[], href: string, cta: string, btn: string][] = [
  [
    'For International Buyers',
    '',
    [
      'One account for every product category',
      'Compare quotes side by side',
      'Third-party QC before balance payment',
      'Single point of contact for freight & customs',
    ],
    '/register?role=buyer',
    'Register as Buyer',
    'btn sm',
  ],
  [
    'For Manufacturers',
    'saffron',
    [
      'Direct access to global importers',
      'Verified badge builds instant trust',
      'RFQs matched to your niche',
      'Export documentation support',
    ],
    '/register?role=vendor',
    'Register as Vendor',
    'btn sm saffron',
  ],
  [
    'For Logistics Partners',
    'green',
    [
      'Get assigned confirmed shipments',
      'Update milestones from one screen',
      'Sea, air, LCL & FCL lanes',
      'CHA & inspection agencies welcome',
    ],
    '/register?role=logistics',
    'Join as Partner',
    'btn sm green',
  ],
];

const MARKETS: [string, string, string, string][] = [
  [
    'United States',
    'Largest home & living importer; buyers actively diversifying suppliers',
    'Décor, furniture, rugs, textiles',
    'Check current tariff schedule; CPSC / Prop 65 for consumer goods',
  ],
  [
    'UAE / GCC',
    'Re-export hub to Middle East & Africa',
    'Basmati, spices, tea, furniture',
    '5% VAT; Halal & food labelling rules; India–UAE CEPA',
  ],
  [
    'United Kingdom',
    'Premium demand for handmade & sustainable',
    'Textiles, décor, leather, wellness',
    'India–UK CETA: zero duty on most Indian goods',
  ],
  ['Germany / Netherlands', 'EU gateway; Ambiente & Rotterdam port', 'Rugs, furniture, décor', 'CE marking; EUDR due diligence for wood'],
  ['Australia', 'Fast-growing furniture & décor retail', 'Furniture, décor, textiles', 'Biosecurity treatment for wood & natural fibres'],
  [
    'Africa (NG, KE, ZA)',
    'Large Indian diaspora & price-led demand',
    'Rice, spices, apparel, incense',
    'Pre-shipment certificates (SONCAP, PVoC)',
  ],
];

export default async function HomePage() {
  const [{ t }, stats, notices, products] = await Promise.all([getI18n(), getStats(), listNotices(5), listProducts({ limit: 8 })]);
  const statItems: [key: string, label: string, value: string][] = [
    ['vendors', 'Verified vendors', fmtNum(stats.vendors)],
    ['clusters', 'Manufacturing clusters', fmtNum(stats.clusters)],
    ['niches', 'Product categories', fmtNum(stats.niches)],
    ['products', 'Export-ready SKUs', fmtNum(stats.products)],
    ['openRfqs', 'Open buyer RFQs', fmtNum(stats.openRfqs)],
    ['tradeValue', 'Trade value (USD)', usd(stats.tradeValue, 0)],
  ];

  return (
    <>
      <HeroSlider />

      <section className="hero">
        <div className="wrap">
          <div>
            <span className="hero-kicker">{t('● Verified Indian manufacturers · 40+ export markets')}</span>
            <h1>
              <span>{t('Made in India.')}</span>
              <br />
              <em>{t('Delivered to the world.')}</em>
            </h1>
            <p className="lead">
              {t(
                'Source handicrafts, rugs, textiles, spices, basmati, tea and more from audited Indian manufacturers — with quotations, quality inspection, export paperwork and door-to-door shipping handled on a single portal.',
              )}
            </p>
            <form className="hero-search" action="/marketplace">
              <select name="niche" aria-label={t('Niche')} defaultValue="">
                <option value="">{t('All categories')}</option>
                {NICHES.map((n) => (
                  <option key={n.slug} value={n.slug}>
                    {t(n.name)}
                  </option>
                ))}
              </select>
              <input
                name="q"
                placeholder={t('What do you want to import? e.g. brass planters, turmeric, silk stoles')}
                aria-label={t('Search products')}
              />
              <button>{t('Search')}</button>
            </form>
            <div className="hero-actions">
              <Link className="btn saffron" href="/dashboard/rfqs/new">
                {t('Post a Buying Requirement')}
              </Link>
              <Link className="btn ghost" href="/register?role=vendor">
                {t('Register as Manufacturer')}
              </Link>
            </div>
            <div className="small muted">
              ✔ {t('KYC-verified vendors')} &nbsp; ✔ {t('Pre-shipment QC')} &nbsp; ✔ {t('Milestone tracking')} &nbsp; ✔ FOB / CIF / DDP
            </div>
          </div>
          <NetworkMap />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2 className="section-title">{t('Online Services')}</h2>
            <span className="small muted">{t('Quick access for buyers, manufacturers & partners')}</span>
          </div>
          <div className="tiles">
            {TILES.map(([href, title, sub, icon]) => (
              <Link key={href} className="tile" href={href}>
                <span className="tile-ic">{icon}</span>
                <b>{t(title)}</b>
                <span>{t(sub)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="stats">
            {statItems.map(([key, label, value], i) => (
              <div key={key} className={i === 0 ? 'stat accent' : 'stat'}>
                <div className="stat-n">{value}</div>
                <div className="stat-l">{t(label)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap split">
          <div className="block">
            <div className="block-head saffron">
              <h3>{t('Phase-1 Priority Niches')}</h3>
              <Link className="small" href="/niches">
                {t(`View all ${NICHES.length} niches & research →`)}
              </Link>
            </div>
            <div className="block-body">
              <div className="grid g2">
                {NICHES.filter((n) => n.phase === 1).map((n) => (
                  <Link
                    key={n.slug}
                    className="niche-card"
                    style={{ '--c': n.color } as CSSProperties}
                    href={`/marketplace?niche=${n.slug}`}
                  >
                    <Placeholder label={sectorName(n.slug)} size="Image" className="niche-img" />
                    <span>
                      <b>{t(n.name)}</b>
                      <small>{n.clusters}</small>
                      <br />
                      <small>→ {n.markets}</small>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="grid" style={{ alignContent: 'start' }}>
            <div className="block">
              <div className="block-head red">
                <h3>{t('Notices & Circulars')}</h3>
                <span className="tiny muted">{t('Latest')}</span>
              </div>
              <div className="block-body" style={{ paddingTop: 4, paddingBottom: 4 }}>
                <ul className="notices">
                  {notices.map((n, i) => (
                    <li key={n.id}>
                      <span className="ndate">
                        <b>{n.createdAt.getUTCDate()}</b>
                        {n.createdAt.toLocaleString('en', { month: 'short', timeZone: 'UTC' })}
                      </span>
                      <span>
                        <span className="badge info">{t(n.tag)}</span>
                        {i < 2 && <span className="new-tag">{t('NEW')}</span>}
                        <div className="t">{n.title}</div>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="block">
              <div className="block-head green">
                <h3>{t('Important Links')}</h3>
              </div>
              <div className="block-body">
                <ul className="small" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
                  <li>
                    <Link href="/about#verification">{t('Vendor verification process')}</Link>
                  </li>
                  <li>
                    <Link href="/tools#incoterms">{t('Incoterms 2020 quick guide')}</Link>
                  </li>
                  <li>
                    <Link href="/tools#docs">{t('Export documentation checklist')}</Link>
                  </li>
                  <li>
                    <Link href="/about#programme">{t('Founding Vendor Programme')}</Link>
                  </li>
                  <li>
                    <Link href="/about#revenue">{t('Fees & commission structure')}</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2 className="section-title">{t('How Himbridge Works')}</h2>
            <span className="small muted">{t('From requirement to doorstep')}</span>
          </div>
          <div className="steps">
            {STEPS.map(([title, text]) => (
              <div key={title} className="step">
                <b>{t(title)}</b>
                <p>{t(text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <h2 className="section-title">{t('Newly Listed Products')}</h2>
            <Link className="btn sm ghost" href="/marketplace">
              {t('Open marketplace →')}
            </Link>
          </div>
          <div className="products">
            {products.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap grid g3">
          {AUDIENCES.map(([title, tone, items, href, cta, btn]) => (
            <div key={title} className="block">
              <div className={`block-head ${tone}`}>
                <h3>{t(title)}</h3>
              </div>
              <div className="block-body small">
                <ul style={{ paddingLeft: 18, marginTop: 0, lineHeight: 1.8 }}>
                  {items.map((it) => (
                    <li key={it}>{t(it)}</li>
                  ))}
                </ul>
                <Link className={btn} href={href}>
                  {t(cta)}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="block">
            <div className="block-head">
              <h3>{t('Priority Export Markets')}</h3>
              <span className="tiny muted">{t('Duties and agreements change — always verify current rates')}</span>
            </div>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t('Market')}</th>
                    <th>{t('Why it matters')}</th>
                    <th>{t('Best-fit niches')}</th>
                    <th>{t('Compliance note')}</th>
                  </tr>
                </thead>
                <tbody>
                  {MARKETS.map(([market, why, fit, note], i) => (
                    <tr key={market}>
                      <td>{i + 1}</td>
                      <td>
                        <b>{t(market)}</b>
                      </td>
                      <td>{t(why)}</td>
                      <td>{t(fit)}</td>
                      <td className="small muted">{t(note)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
