import type { SectorKey } from './sectors';

/** Reference content for the Trade Tools page. */

export const HS_CODES: readonly [code: string, description: string, niche: string][] = [
  ['8306.29', 'Statuettes & other ornaments of base metal (brass décor)', 'Handicrafts'],
  ['4420.90', 'Wooden ornaments, caskets, inlaid wood articles', 'Handicrafts'],
  ['6802.91', 'Worked marble articles', 'Handicrafts'],
  ['6913.90', 'Ceramic ornamental articles (blue pottery)', 'Handicrafts'],
  ['9403.60', 'Wooden furniture (other)', 'Furniture'],
  ['9401.61', 'Upholstered seats with wooden frames', 'Furniture'],
  ['9401.31', 'Swivel seats, wooden frame / office chairs', 'Furniture'],
  ['5701.10', 'Hand-knotted carpets of wool', 'Rugs'],
  ['5702.39', 'Flat-woven carpets of other vegetable fibres (jute)', 'Rugs'],
  ['6302.21', 'Printed bed linen of cotton', 'Home textiles'],
  ['6304.92', 'Furnishing articles of cotton (cushion covers)', 'Home textiles'],
  ['6301.40', 'Blankets & throws of synthetic fibres', 'Home textiles'],
  ['1211.90', 'Plants & parts used in pharmacy (herbs)', 'Wellness'],
  ['3304.99', 'Beauty / skin-care preparations', 'Wellness'],
  ['7117.19', 'Imitation jewellery of base metal', 'Jewellery'],
  ['4202.21', 'Handbags with outer surface of leather', 'Leather'],
  ['0904.21', 'Dried chillies, not crushed', 'Spices'],
  ['0910.30', 'Turmeric (curcuma)', 'Spices'],
  ['0908.31', 'Cardamom, neither crushed nor ground', 'Spices'],
  ['0904.11', 'Black pepper, neither crushed nor ground', 'Spices'],
  ['1006.30', 'Semi-milled or wholly milled rice (basmati)', 'Rice & grains'],
  ['0902.30', 'Black tea, packs up to 3 kg', 'Tea & coffee'],
  ['0901.11', 'Coffee, not roasted, not decaffeinated', 'Tea & coffee'],
  ['0801.32', 'Cashew nuts, shelled', 'Nuts & superfoods'],
  ['2008.19', 'Nuts & seeds, otherwise prepared (roasted makhana)', 'Nuts & superfoods'],
  ['5007.20', 'Woven fabrics of silk', 'Handloom & silk'],
  ['6214.10', 'Shawls, scarves & stoles of silk', 'Handloom & silk'],
  ['6109.10', 'T-shirts of cotton, knitted', 'Apparel'],
  ['6802.21', 'Worked marble & travertine, simply cut', 'Stone'],
  ['6802.93', 'Worked granite', 'Stone'],
  ['3301.29', 'Essential oils (other than citrus)', 'Essential oils'],
  ['3307.41', 'Agarbatti & other odoriferous preparations', 'Incense & festive'],
  ['3406.00', 'Candles, tapers & the like', 'Incense & festive'],
];

/** Documents every Indian export shipment needs, plus the extras each sector adds. */
export const EXPORT_DOCS_COMMON: readonly string[] = [
  'Importer Exporter Code (IEC) from DGFT',
  'GST registration & LUT for zero-rated exports',
  'AD code registered with customs at the port of export',
  'RCMC from the relevant Export Promotion Council',
  'Commercial invoice & packing list',
  'Shipping bill (ICEGATE) — filed by your customs broker or courier',
  'Bill of lading / airway bill / courier waybill',
  'Certificate of Origin (preferential for FTA markets such as UK and UAE)',
  'Pre-shipment inspection report (AQL)',
];

export const EXPORT_DOCS_BY_SECTOR: Record<SectorKey, readonly string[]> = {
  home: [
    'EPCH / CEPC membership (RCMC) for handicrafts and carpets',
    'Fumigation & ISPM-15 certificate for wooden goods/packaging',
    'FSC or VRIKSH timber legality for wood (EUDR for EU buyers)',
    'Lead & Prop 65 test reports for US-bound metal and ceramic items',
    'GoodWeave / Craftmark labels where the buyer asks',
  ],
  food: [
    'FSSAI central licence',
    'Spices Board CRES (spices) or APEDA RCMC (rice, nuts, makhana)',
    'Phytosanitary certificate (Plant Quarantine)',
    'Lab report for pesticide residues & aflatoxin (EU/US limits)',
    'US FDA food facility registration & prior notice (USA)',
    'Health / quality certificate from Export Inspection Council where required',
  ],
  fashion: [
    'AEPC / Silk EPC / HEPC / CLE / GJEPC membership as applicable',
    'OEKO-TEX or GOTS certificate for textiles',
    'REACH / AZO-dye test reports for EU textiles and leather',
    'Handloom mark or GI authorised-user certificate where claimed',
    'Hallmark / gemstone report for precious jewellery',
  ],
  wellness: [
    'AYUSH manufacturing licence & GMP certificate',
    'Free Sale Certificate / COPP for regulated markets',
    'Product composition & safety data sheet (MSDS)',
    'Lab report for heavy metals & microbiology',
    'Ingredient labelling as per destination rules (FDA, EU cosmetics)',
  ],
};

export const INCOTERM_GUIDE: readonly [term: string, sellerCovers: string, riskPasses: string][] = [
  ['EXW', 'Goods ready at factory', "At seller's premises"],
  ['FOB', 'Export clearance + loading on vessel', 'On board at origin port'],
  ['CFR', 'FOB + main sea freight', 'On board at origin port'],
  ['CIF', 'CFR + minimum insurance', 'On board at origin port'],
  ['DAP', 'Delivery to named place, unpaid duties', 'At destination, before unloading'],
  ['DDP', 'Everything incl. import duty & taxes', "At buyer's door"],
];

export const UNITS = ['pcs', 'sets', 'pairs', 'kg', 'sq m', 'containers'] as const;
