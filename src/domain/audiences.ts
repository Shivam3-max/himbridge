import type { BuyerType, RequestKind } from './sourcing';

/**
 * Copy for the "Source from India" landing pages (/solutions/<slug>), one per buyer type.
 * Examples and timings come from the Order & Delivery Playbook.
 */
export interface Audience {
  slug: string;
  type: BuyerType;
  nav: string;
  title: string;
  lead: string;
  img: string;
  kind: RequestKind;
  cta: string;
  benefits: [title: string, text: string][];
  steps: [title: string, text: string][];
  examples: [what: string, size: string, ship: string][];
  faqs: [q: string, a: string][];
}

export const AUDIENCES: Audience[] = [
  {
    slug: 'brands',
    type: 'brand',
    nav: 'E-commerce & D2C brands',
    title: 'Make your products in India, in small batches',
    lead: 'Private-label textiles, décor, fashion, spices and wellness products from verified Indian makers. Start from 50–300 pieces, with samples first and door-to-door delivery.',
    img: '/images/hero-crafted.jpg',
    kind: 'manufacture',
    cta: 'Start a sourcing request',
    benefits: [
      ['Low minimums', 'Makers who accept 50–300 pieces per design, so you can test a product before you scale it.'],
      ['Compare to what you pay now', 'Tell us your current cost and target price. Every offer shows your saving and margin.'],
      ['Samples before you commit', 'Order samples from two or three makers and get them in one courier box.'],
      ['Your brand, your packaging', 'Woven labels, hang tags, printed boxes and barcodes ready for Amazon or Shopify.'],
      ['Delivered duty paid', 'Small orders go by express courier with duties prepaid: one price, no surprises at the door.'],
      ['Easy reorders', 'Reorder a best-seller in two clicks, or set a monthly or seasonal plan.'],
    ],
    steps: [
      ['Tell us what you sell', 'Paste your product or store link, your current cost and your target price.'],
      ['Get matched offers', 'We shortlist verified makers in the right cluster. Offers usually arrive within 3–5 working days.'],
      ['Order samples', 'Approve a sample or ask for changes. Typical sample time is 7–15 days.'],
      ['Place your production order', 'Pay 50% to start and the balance after our QC inspection.'],
      ['Receive at your door', 'Courier or air for small batches; sea freight once you scale.'],
    ],
    examples: [
      ['Block-printed cotton cushion covers, own label', '200 pcs · about $1,400', 'Express courier, DDP · 5–8 days'],
      ['Turmeric, chilli and garam masala in branded pouches', '1,000 pouches · about $2,600', 'Air cargo · 6–10 days'],
      ['Handloom silk scarves for a boutique', '150 pcs · about $3,300', 'Express courier, DDP · 5–8 days'],
      ['Brass and wood décor for a home-goods store', '600 pcs · about $9,500', 'Sea freight, shared container · 30–40 days'],
    ],
    faqs: [
      [
        'What is the smallest order?',
        'It depends on the product: 50–100 pieces for textiles and décor, 300–1,000 for packaged spices. Each offer shows its minimum.',
      ],
      [
        'How do I pay?',
        'Trade orders are usually 50% before production and 50% after QC. Bank transfer or card; payments go through Himbridge, not directly to the maker.',
      ],
      [
        'Who handles customs?',
        'Choose DDP and we handle it end to end. You get one landed price and the courier delivers to your warehouse or 3PL.',
      ],
      [
        'Can you match a product I already sell?',
        'Yes. Share the product link and photos, and say what you would change. Makers quote on a like-for-like version.',
      ],
    ],
  },
  {
    slug: 'designers',
    type: 'designer',
    nav: 'Architects & interior designers',
    title: 'Source custom pieces for your projects from Indian craft clusters',
    lead: 'Hand-knotted rugs, solid-wood furniture, brass lighting, stone and handloom textiles, made to your drawings and delivered to the project site.',
    img: '/images/gallery-cluster.jpg',
    kind: 'project',
    cta: 'Send a project list',
    benefits: [
      ['One list, many makers', 'Upload your BOQ or spec sheet. We split it across the right clusters and send back one comparison.'],
      ['Made to your drawings', 'Custom sizes, finishes, colours and CAD drawings. Strike-offs and finish samples before production.'],
      ['Trade pricing', 'Prices from the workshop with no showroom margin, so there is room for your fee.'],
      ['Site delivery dates', 'We plan production backwards from your installation date and choose air or sea to meet it.'],
      ['Quality checked', 'Every piece is inspected against your spec before it leaves India.'],
      ['Consolidated shipping', 'Pieces from several makers are packed together in one shipment to your site or warehouse.'],
    ],
    steps: [
      ['Share the project', 'Project name, site city, install date, and the list of pieces with drawings or reference links.'],
      ['Receive a priced comparison', 'Each line is priced by suitable makers, with lead times and samples available.'],
      ['Approve samples', 'Finish swatches, rug strike-offs or a sample piece, sent by courier.'],
      ['Production & QC', 'Progress photos at each milestone and an inspection report before dispatch.'],
      ['Delivered to site', 'Consolidated sea or air freight, cleared and delivered, with installation-ready packing.'],
    ],
    examples: [
      [
        'Villa in Dubai: 60 pieces (rugs, lamps, side tables)',
        'about ₹12 lakh · $14,000',
        'Sea freight, shared container · 12–18 days to Jebel Ali',
      ],
      ['Boutique hotel in London: 40 custom rugs', 'about $38,000', 'Sea freight, shared container · 30–40 days'],
      ['Restaurant fit-out in New York: brass lighting and stone tables', 'about $22,000', 'Air cargo for lighting, sea for stone'],
      ['Showroom sample set: 12 pieces', 'about $2,500', 'Express courier · 5–8 days'],
    ],
    faqs: [
      [
        'Can makers work from my CAD drawings?',
        'Yes. Attach PDFs or images to each line. Makers confirm feasibility and send shop drawings for approval before production.',
      ],
      [
        'What if the project dates move?',
        'Production can be held after sampling. Finished goods can be stored in India for up to 60 days before shipping.',
      ],
      [
        'Do you handle mixed orders?',
        'Yes. A rug from Bhadohi, lamps from Moradabad and furniture from Jodhpur can travel in one consolidated shipment.',
      ],
      [
        'Is there a trade programme?',
        'Registered design firms get trade pricing, a named sourcing manager and free sample consolidation on their first project.',
      ],
    ],
  },
  {
    slug: 'importers',
    type: 'importer',
    nav: 'Importers & distributors',
    title: 'Container orders from verified Indian manufacturers',
    lead: 'Bulk handicrafts, rugs, home textiles, apparel, basmati rice, spices, tea and more, with competitive quotes, inspection and shipping managed end to end.',
    img: '/images/gallery-port.jpg',
    kind: 'source',
    cta: 'Post a bulk requirement',
    benefits: [
      ['Competing quotes in 48 hours', 'Post one RFQ and get prices from several verified makers in your sector.'],
      ['Verified factories', 'KYC, export licences and capacity checked before a manufacturer can quote.'],
      ['Milestone payments', '30/70 or LC. The balance is released only after the QC inspection passes.'],
      ['Full shipping & documents', 'Certificate of origin, phytosanitary and lab reports, bill of lading, all tracked online.'],
      ['Landed cost before you buy', 'Duty, freight and fees estimated for your market before you accept a quote.'],
      ['Repeat orders made easy', 'Reorder from a past order, or set seasonal programmes with the same maker.'],
    ],
    steps: [
      ['Post your requirement', 'Product, quantity, destination port, target price and Incoterm.'],
      ['Compare quotes', 'Side by side: price, lead time, certifications and the best value.'],
      ['Accept and pay the advance', 'An order is created with milestones and a payment schedule.'],
      ['Production, QC and shipping', 'Inspection report, then container loading and the bill of lading.'],
      ['Clear and receive', 'Documents online; tracking until delivery.'],
    ],
    examples: [
      ['Hand-knotted wool rugs for a US retailer', "40' container · about $185,000", 'Sea FCL · 30–40 days to the US East Coast'],
      ['Basmati rice for a Gulf distributor', '50 tonnes · about $64,000', 'Sea FCL · 7–12 days to Jebel Ali'],
      ['Cotton bed linen for a UK chain', "20' container · about $70,000", 'Sea FCL · 25–35 days, zero UK duty under CETA'],
      ['Whole spices for an EU packer', '12 tonnes · about $48,000', 'Sea FCL with pesticide-residue lab reports'],
    ],
    faqs: [
      [
        'How are manufacturers verified?',
        'We check company registration, IEC, GST, export history and capacity, and visit or video-audit the factory before activation.',
      ],
      [
        'Can I use a letter of credit?',
        'Yes. LCs and 30/70 bank transfers are both supported; documents are uploaded to the order for the bank.',
      ],
      ['Which Incoterms do you support?', 'EXW, FOB, CFR, CIF, DAP and DDP. Most container buyers use FOB or CIF.'],
      [
        'How do US tariffs affect pricing?',
        'Tariffs change often in 2026. The landed-cost tool lets you test duty rates, and we flag changes on your open orders.',
      ],
    ],
  },
];

export const audienceBySlug = (slug: string) => AUDIENCES.find((a) => a.slug === slug);
export const audienceByType = (type: BuyerType) => AUDIENCES.find((a) => a.type === type);

/** Home page "Who are you sourcing for?" cards. */
export const HOME_PATHS: [href: string, img: string, title: string, size: string, text: string][] = [
  [
    '/solutions/brands',
    '/images/hero-crafted.jpg',
    'E-commerce & D2C brands',
    'From 50 pieces',
    'Private-label textiles, décor, fashion and spices with samples first and door-to-door delivery.',
  ],
  [
    '/solutions/designers',
    '/images/gallery-cluster.jpg',
    'Architects & interior designers',
    'Project lists',
    'Custom rugs, furniture, lighting and stone made to your drawings and shipped to site.',
  ],
  [
    '/solutions/importers',
    '/images/gallery-port.jpg',
    'Importers & distributors',
    'Full containers',
    'Competing quotes, inspection, LC or milestone payments, and full export paperwork.',
  ],
  [
    '/export-ready',
    '/images/gallery-factory.jpg',
    'Indian manufacturers',
    'Start exporting',
    'We set up your export licences, train your team and bring you verified overseas buyers.',
  ],
];
