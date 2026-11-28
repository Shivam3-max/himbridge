import type { SectorKey } from './sectors';

/**
 * Export readiness checklist for Indian manufacturers (from the Export Readiness Programme report).
 * Each item says where to apply, the government fee, how long it takes and who usually handles it.
 * Fees marked "verify" had conflicting sources; confirm before quoting a client.
 */
export interface ReadinessItem {
  key: string;
  name: string;
  group: 'foundation' | 'licence' | 'sector' | 'buyer';
  what: string;
  applyAt: string;
  url?: string;
  fee: string;
  time: string;
  validity: string;
  who: string;
  /** Sectors that need it. Empty = every manufacturer. */
  sectors: SectorKey[];
  /** Optional items improve the score but are not required to ship. */
  optional?: boolean;
}

export const READINESS_GROUPS: Record<ReadinessItem['group'], string> = {
  foundation: 'Business foundation',
  licence: 'Export licence pack',
  sector: 'Sector registrations',
  buyer: 'Buyer certifications',
};

export const READINESS_ITEMS: ReadinessItem[] = [
  {
    key: 'gst',
    name: 'GST registration',
    group: 'foundation',
    what: 'Tax registration. Needed for the LUT and for GST refunds on exports.',
    applyAt: 'GST portal',
    url: 'https://www.gst.gov.in',
    fee: 'Nil',
    time: '3–30 working days',
    validity: 'Until cancelled',
    who: 'Chartered accountant',
    sectors: [],
  },
  {
    key: 'udyam',
    name: 'Udyam (MSME) registration',
    group: 'foundation',
    what: 'MSME status: cheaper trademarks, priority lending and trade-fair subsidies.',
    applyAt: 'Udyam portal',
    url: 'https://udyamregistration.gov.in',
    fee: 'Free',
    time: 'Same day',
    validity: 'Permanent',
    who: 'You or Himbridge',
    sectors: [],
  },
  {
    key: 'bank',
    name: 'Current account with an AD bank',
    group: 'foundation',
    what: 'A bank authorised to receive foreign currency. Every export payment lands here.',
    applyAt: 'Any authorised-dealer bank',
    fee: 'Bank charges',
    time: '2–7 days',
    validity: 'Ongoing',
    who: 'You',
    sectors: [],
  },
  {
    key: 'iec',
    name: 'IEC (Importer Exporter Code)',
    group: 'licence',
    what: 'The 10-digit export licence. Needed for every shipment and every other export registration.',
    applyAt: 'DGFT portal',
    url: 'https://www.dgft.gov.in',
    fee: '₹500',
    time: '1–2 days',
    validity: 'Lifetime; update every year between 1 April and 30 June',
    who: 'Himbridge or your CA',
    sectors: [],
  },
  {
    key: 'lut',
    name: 'GST LUT (form RFD-11)',
    group: 'licence',
    what: 'Lets you export without paying IGST upfront.',
    applyAt: 'GST portal',
    url: 'https://www.gst.gov.in',
    fee: 'Nil',
    time: 'Same day',
    validity: 'One financial year (renew every April)',
    who: 'Chartered accountant',
    sectors: [],
  },
  {
    key: 'ad_code',
    name: 'AD code registration',
    group: 'licence',
    what: 'Links your bank account to customs at each port, so payments and incentives reach you.',
    applyAt: 'Bank letter, then ICEGATE',
    url: 'https://www.icegate.gov.in',
    fee: 'Nil',
    time: '3–4 days',
    validity: 'Until you change bank',
    who: 'Customs broker',
    sectors: [],
  },
  {
    key: 'icegate',
    name: 'ICEGATE registration',
    group: 'licence',
    what: 'Customs e-filing and tracking; incentive scrips are credited here.',
    applyAt: 'ICEGATE',
    url: 'https://www.icegate.gov.in',
    fee: 'Free',
    time: '1–3 days',
    validity: 'Ongoing',
    who: 'You or your customs broker',
    sectors: [],
  },
  {
    key: 'rcmc',
    name: 'RCMC (export council membership)',
    group: 'licence',
    what: 'Membership of the export promotion council for your product (EPCH, CEPC, AEPC, APEDA…). Needed for incentives and trade fairs.',
    applyAt: 'e-RCMC on the DGFT portal',
    url: 'https://www.dgft.gov.in',
    fee: 'Varies by council (about ₹5,000–6,000)',
    time: '1–3 weeks',
    validity: '5 years',
    who: 'Himbridge',
    sectors: [],
  },
  {
    key: 'ecoo',
    name: 'Certificate of origin (eCoO) registration',
    group: 'licence',
    what: 'Lets you issue certificates of origin, so UK, UAE and Australian buyers pay lower or zero duty.',
    applyAt: 'eCoO portal (DGFT)',
    url: 'https://coo.dgft.gov.in',
    fee: 'About ₹200 + GST per certificate (verify)',
    time: 'Same day – 2 days',
    validity: 'Per shipment',
    who: 'Himbridge',
    sectors: [],
  },
  {
    key: 'fssai',
    name: 'FSSAI central licence',
    group: 'sector',
    what: 'Mandatory for every food exporter: spices, rice, tea, coffee, nuts, makhana.',
    applyAt: 'FoSCoS portal',
    url: 'https://foscos.fssai.gov.in',
    fee: '₹7,500 per year',
    time: '30–60 days (start early)',
    validity: '1–5 years',
    who: 'Food regulatory consultant',
    sectors: ['food'],
  },
  {
    key: 'commodity_board',
    name: 'Spices Board CRES / APEDA / Tea or Coffee Board',
    group: 'sector',
    what: 'Commodity board registration for your product (counts as your RCMC).',
    applyAt: 'Board portal or DGFT',
    fee: '₹5,000–15,000 (verify)',
    time: '1–4 weeks',
    validity: '3–5 years',
    who: 'Himbridge',
    sectors: ['food'],
  },
  {
    key: 'us_fda',
    name: 'US FDA food facility registration',
    group: 'sector',
    what: 'Required for any food going to the USA, with a US agent. Renew October–December of even years.',
    applyAt: 'FDA online (FURLS)',
    url: 'https://www.fda.gov/food/online-registration-food-facilities',
    fee: 'Free (US agent about $300–1,000 a year)',
    time: 'A few days',
    validity: '2 years',
    who: 'Food regulatory consultant',
    sectors: ['food'],
  },
  {
    key: 'phyto',
    name: 'Phytosanitary registration (PQMS)',
    group: 'sector',
    what: 'One-time registration, then a certificate per shipment after inspection, for plant products and some wood.',
    applyAt: 'PQMS portal',
    url: 'https://pqms.cgg.gov.in',
    fee: 'Inspection fee per lot',
    time: '1–3 days per shipment',
    validity: 'Per shipment',
    who: 'Customs broker or Himbridge',
    sectors: ['food', 'home'],
  },
  {
    key: 'ayush',
    name: 'AYUSH licence + GMP',
    group: 'sector',
    what: 'Manufacturing licence for Ayurveda and herbal products, plus free-sale / CoPP certificates for buyers.',
    applyAt: 'State Ayush authority (e-AUSHADHI)',
    fee: 'From ₹1,000 (verify)',
    time: '1–3 months',
    validity: '5 years',
    who: 'Regulatory consultant',
    sectors: ['wellness'],
  },
  {
    key: 'ispm15',
    name: 'ISPM-15 wood packaging supplier',
    group: 'sector',
    what: 'Wooden pallets and crates must be heat-treated and stamped. Line up an accredited treatment provider.',
    applyAt: 'PPQS-accredited treatment provider',
    fee: 'About ₹300–1,500 per lot',
    time: '1–2 days',
    validity: 'Per shipment',
    who: 'Treatment provider',
    sectors: ['home'],
  },
  {
    key: 'lab_tests',
    name: 'Market lab tests (REACH / Prop 65 / pesticide)',
    group: 'sector',
    what: 'Tests buyers ask for: azo dyes and REACH for EU textiles, lead for US metal and kids items, pesticide residue for food.',
    applyAt: 'NABL or CPSC-accepted lab',
    fee: 'About ₹3,000–25,000 per test (verify)',
    time: '3–7 days',
    validity: 'Per lot or per year',
    who: 'Lab partner',
    sectors: ['fashion', 'home', 'food'],
    optional: true,
  },
  {
    key: 'trademark',
    name: 'Trademark (India, then Madrid)',
    group: 'buyer',
    what: 'Protects your brand name before you sell abroad.',
    applyAt: 'IP India, then WIPO Madrid',
    url: 'https://ipindia.gov.in',
    fee: '₹4,500 per class for MSMEs',
    time: 'Filing in a day; registration takes months',
    validity: '10 years',
    who: 'Trademark attorney',
    sectors: [],
    optional: true,
  },
  {
    key: 'social_audit',
    name: 'SEDEX / SMETA or BSCI social audit',
    group: 'buyer',
    what: 'UK and EU retailers ask for a social audit before they order.',
    applyAt: 'Approved audit firm',
    fee: 'About ₹1.5–3 lakh including preparation',
    time: '1–3 months',
    validity: '1–2 years',
    who: 'Certification body',
    sectors: ['home', 'fashion'],
    optional: true,
  },
  {
    key: 'product_cert',
    name: 'Product certification (GOTS / OEKO-TEX / FSC / GoodWeave / FSSC 22000)',
    group: 'buyer',
    what: 'The certification your buyers ask for most in your category.',
    applyAt: 'Accredited certifier',
    fee: 'About ₹0.5–3 lakh',
    time: '1–6 months',
    validity: '1 year',
    who: 'Certification body',
    sectors: [],
    optional: true,
  },
];

export const READINESS_STATUSES = ['missing', 'in_progress', 'done', 'na'] as const;
export type ReadinessStatus = (typeof READINESS_STATUSES)[number];
export const READINESS_STATUS_LABEL: Record<ReadinessStatus, string> = {
  missing: 'Not started',
  in_progress: 'In progress',
  done: 'Done',
  na: 'Not applicable',
};

/** Items that apply to a manufacturer in the given sector. */
export const readinessItemsFor = (sector: SectorKey | undefined) =>
  READINESS_ITEMS.filter((i) => !i.sectors.length || (sector && i.sectors.includes(sector)));

/**
 * Readiness score 0–100: share of required items that are done (or not applicable).
 * `canShip` is true once every required item is done.
 */
export function readinessScore(items: ReadinessItem[], status: Record<string, ReadinessStatus | undefined>) {
  const required = items.filter((i) => !i.optional && status[i.key] !== 'na');
  const done = required.filter((i) => status[i.key] === 'done').length;
  const score = required.length ? Math.round((done / required.length) * 100) : 100;
  return { score, done, required: required.length, canShip: done === required.length };
}

// ── Services Himbridge sells (for manufacturers and for buyers) ──

export interface ServiceOffer {
  key: string;
  name: string;
  for: 'vendor' | 'buyer';
  includes: string;
  price: string;
}

export const SERVICES: ServiceOffer[] = [
  {
    key: 'export_start',
    name: 'Export Start',
    for: 'vendor',
    includes: 'IEC, GST LUT, AD code, ICEGATE and RCMC filed for you, plus training modules 1–3.',
    price: '₹25,000–40,000 one-time',
  },
  {
    key: 'sector_ready',
    name: 'Sector Ready',
    for: 'vendor',
    includes: 'FSSAI, commodity board, FDA or lab tests for one category, plus training modules 4–6.',
    price: '₹30,000–75,000 one-time',
  },
  {
    key: 'certify',
    name: 'Certify',
    for: 'vendor',
    includes: 'Gap audit and coordination of one buyer certification (SEDEX, GOTS, FSC…).',
    price: "10–15% of the certifier's fee",
  },
  {
    key: 'catalogue',
    name: 'Catalogue & photography',
    for: 'vendor',
    includes: 'Studio and lifestyle photos, spec sheets and an export price list for your storefront.',
    price: 'Quoted per cluster visit',
  },
  {
    key: 'shipment_desk',
    name: 'Shipment desk',
    for: 'vendor',
    includes: 'Invoice, packing list, certificate of origin, shipping bill and incentive claims for each shipment.',
    price: '₹2,500–7,500 per shipment',
  },
  {
    key: 'training',
    name: 'Export training (8 modules)',
    for: 'vendor',
    includes: 'Pricing, packaging, quality, documents, market compliance, buyer communication and getting paid.',
    price: 'Free for founding vendors',
  },
  {
    key: 'sample_consolidation',
    name: 'Sample consolidation',
    for: 'buyer',
    includes: 'Samples from several makers collected in Delhi and sent to you in one courier box.',
    price: 'Courier at cost + $25 handling',
  },
  {
    key: 'inspection',
    name: 'Pre-shipment QC inspection',
    for: 'buyer',
    includes: 'AQL inspection with photos and a report before you pay the balance.',
    price: 'From $180 per inspection day',
  },
  {
    key: 'factory_visit',
    name: 'Factory visit / video audit',
    for: 'buyer',
    includes: 'A live video walk-through or an in-person visit with our cluster team.',
    price: 'Video free · visit from $150',
  },
  {
    key: 'design_dev',
    name: 'Design & tech-pack help',
    for: 'buyer',
    includes: 'Turn a mood board or sketch into a spec sheet makers can quote on.',
    price: 'From $120 per design',
  },
  {
    key: 'ddp_shipping',
    name: 'Door-to-door (DDP) shipping',
    for: 'buyer',
    includes: 'We ship, clear customs and pay duties, so you get one all-in price.',
    price: 'Quoted per order',
  },
];

export const SERVICE_STATUSES = ['new', 'in_progress', 'done', 'cancelled'] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];
export const SERVICE_STATUS_LABEL: Record<ServiceStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  done: 'Done',
  cancelled: 'Cancelled',
};
export const serviceByKey = (k: string) => SERVICES.find((s) => s.key === k);

/** Public programme page (/export-ready). */
export const PROGRAMME_STEPS: [string, string][] = [
  ['Free readiness check', 'A 30-minute call and a checklist of what you already have and what is missing.'],
  ['Licences in 2 weeks', 'IEC, GST LUT, AD code, ICEGATE and RCMC filed for you by our team and partner CAs.'],
  ['Sector compliance', 'FSSAI, Spices Board, APEDA, US FDA, lab tests or certifications, depending on what you make.'],
  ['Training', 'Eight half-day modules: pricing, packaging, quality, documents, compliance, buyers and getting paid.'],
  ['First shipment, together', 'We prepare the documents, book freight and stay with you until the buyer pays.'],
];

export const PROGRAMME_MODULES = [
  'How exporting works',
  'Export pricing',
  'Product, packaging & labelling',
  'Quality & inspection',
  'Documents',
  'Compliance by market',
  'Buyers & communication',
  'Getting paid & growing',
];
