import type { Metadata } from 'next';
import Link from 'next/link';
import { PageBanner } from '@/components/ui/primitives';
import { getI18n } from '@/i18n/server';

export const metadata: Metadata = { title: 'About Himbridge' };

const ECOSYSTEM: [string, string, string][] = [
  [
    'Buyer',
    'Importers, retailers, e-commerce brands, interior firms, distributors',
    'Browse catalog, post RFQs, compare quotes, place orders, track shipments',
  ],
  [
    'Vendor',
    'Manufacturers, artisan workshops and exporters in our sourcing hubs',
    'KYC verification, list products, quote on RFQs, update production & QC',
  ],
  [
    'Logistics partner',
    'Freight forwarders, CHAs, inspection agencies',
    'Receive assigned shipments, update shipping & customs milestones',
  ],
  ['Himbridge team', 'Operations, compliance, account managers', 'Verify vendors, assign logistics, monitor orders, publish notices'],
];

const VERIFICATION = [
  'Online registration with company and niche details',
  'KYC documents — export registration, tax registration and business licence',
  'Certification review (ISO, BSCI, FSC, CE, GoodWeave…)',
  'Video or physical factory audit',
  'Sample evaluation for listed SKUs',
  'Verified badge issued — vendor can quote on RFQs',
];

const PROGRAMME = [
  'Free Gold listing tier for 12 months',
  'Priority matching on buyer RFQs',
  'Free product photo-shoot at cluster camps',
  'Space at Himbridge trade-fair pavilions',
];

const REVENUE: [string, string, string][] = [
  ['Order commission', 'Percentage of confirmed order value', '3–8%'],
  ['Vendor subscription', 'Basic (free), Gold, Platinum — visibility & RFQ priority', 'Monthly tiers'],
  ['Verification & audit', 'Factory audit and verified badge', 'Per vendor'],
  ['QC inspection', 'Pre-shipment AQL inspection', 'Per inspection'],
  ['Logistics', 'Freight & customs bookings via partners', 'Per shipment'],
  ['Private label', 'Himbridge-owned brands sourced from top vendors', 'Product margin'],
];

const GALLERY: [string, string][] = [
  ['gallery-cluster', 'Artisan cluster visit'],
  ['gallery-factory', 'Factory audit'],
  ['gallery-qc', 'QC inspection'],
  ['gallery-port', 'Ready to ship'],
];

export default async function AboutPage() {
  const { t } = await getI18n();
  return (
    <>
      <PageBanner
        img="/images/banner-about.jpg"
        kicker="About Himbridge"
        line="Strength in what we source. Trust in how we deliver."
        pos="center 70%"
      />
      <div className="pagebar">
        <div className="wrap">
          <div className="crumbs">
            <Link href="/">{t('Home')}</Link> › {t('About Himbridge')}
          </div>
          <h1>{t('About Himbridge')}</h1>
          <p>
            <b>Him</b>
            {t('alaya +')} <b>bridge</b>
            {t(
              ': the strength and high standards of the mountains, and the trusted connection between great makers and buyers in 40+ countries.',
            )}
          </p>
        </div>
      </div>

      <div className="wrap section grid" style={{ gap: 20 }}>
        <div className="split">
          <div className="block">
            <div className="block-head saffron">
              <h3>{t('Our mission')}</h3>
            </div>
            <div className="block-body">
              <p>
                {t(
                  'Himbridge is a 360° cross-border trade ecosystem. We onboard verified manufacturers from leading manufacturing clusters across selected categories and give international buyers one trusted portal to discover products, raise RFQs, compare quotations, place orders and track goods door to door.',
                )}
              </p>
              <p>
                {t('Himbridge sits in the middle as the')} <b>{t('trust and operations layer')}</b>
                {t(': vendor verification, quality inspection, export documentation, freight booking and milestone-based payments.')}
              </p>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- static editorial photo */}
          <img
            className="about-photo"
            src="/images/about-weaver.jpg"
            alt={t('Artisan weaving a hand-knotted rug on a loom')}
            loading="lazy"
          />
        </div>

        <div className="block" id="ecosystem">
          <div className="block-head">
            <h3>{t('The ecosystem')}</h3>
          </div>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('Participant')}</th>
                  <th>{t('Who')}</th>
                  <th>{t('What they do on Himbridge')}</th>
                </tr>
              </thead>
              <tbody>
                {ECOSYSTEM.map(([who, desc, does]) => (
                  <tr key={who}>
                    <td>
                      <b>{t(who)}</b>
                    </td>
                    <td>{t(desc)}</td>
                    <td>{t(does)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid g2">
          <div className="block" id="verification">
            <div className="block-head green">
              <h3>{t('Vendor verification process')}</h3>
            </div>
            <div className="block-body small">
              <ol style={{ paddingLeft: 18, margin: 0, lineHeight: 1.9 }}>
                {VERIFICATION.map((s) => (
                  <li key={s}>{t(s)}</li>
                ))}
              </ol>
            </div>
          </div>
          <div className="block" id="programme">
            <div className="block-head saffron">
              <h3>{t('Founding Vendor Programme')}</h3>
            </div>
            <div className="block-body small">
              <p>{t('The first 100 verified manufacturers receive:')}</p>
              <ul style={{ paddingLeft: 18, lineHeight: 1.9, marginTop: 0 }}>
                {PROGRAMME.map((s) => (
                  <li key={s}>{t(s)}</li>
                ))}
              </ul>
              <Link className="btn sm saffron" href="/register?role=vendor">
                {t('Apply now')}
              </Link>
            </div>
          </div>
        </div>

        <div className="block" id="revenue">
          <div className="block-head">
            <h3>{t('Fees & business model')}</h3>
          </div>
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{t('Stream')}</th>
                  <th>{t('How it works')}</th>
                  <th>{t('Indicative')}</th>
                </tr>
              </thead>
              <tbody>
                {REVENUE.map(([stream, how, ind]) => (
                  <tr key={stream}>
                    <td>
                      <b>{t(stream)}</b>
                    </td>
                    <td>{t(how)}</td>
                    <td>{t(ind)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid g4">
          {GALLERY.map(([img, label]) => (
            <figure key={img} className="gal">
              {/* eslint-disable-next-line @next/next/no-img-element -- static gallery photo */}
              <img src={`/images/${img}.jpg`} alt="" loading="lazy" />
              <figcaption>{t(label)}</figcaption>
            </figure>
          ))}
        </div>

        <div className="block" id="policies">
          <div className="block-head">
            <h3>{t('Terms & privacy')}</h3>
          </div>
          <div className="block-body small muted">
            {t(
              'Placeholder — full Terms of Use, Privacy Policy, Refund & Dispute Resolution policy and Vendor Code of Conduct will be published here before public launch.',
            )}
          </div>
        </div>
      </div>
    </>
  );
}
