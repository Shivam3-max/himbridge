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
  ['9405.11', 'LED luminaires designed for fixed installation', 'LED & solar'],
  ['9405.42', 'LED lamps & lighting fittings (incl. solar street lights)', 'LED & solar'],
  ['8541.43', 'Photovoltaic cells assembled in modules', 'LED & solar'],
  ['8504.40', 'Static converters (chargers, adapters)', 'Electronics'],
  ['8518.30', 'Headphones & earphones', 'Electronics'],
  ['8516.60', 'Ovens, cookers, air fryers', 'Home & kitchen'],
  ['7323.93', 'Stainless steel table & kitchenware', 'Home & kitchen'],
  ['4819.10', 'Cartons & boxes of corrugated paper', 'Packaging'],
  ['8205.59', 'Hand tools (other)', 'Hardware'],
  ['9503.00', 'Toys', 'Toys & festive'],
  ['9505.10', 'Christmas & festive articles', 'Toys & festive'],
];

export const EXPORT_DOCS: Record<'IN' | 'CN', readonly string[]> = {
  IN: [
    'Importer Exporter Code (IEC) from DGFT',
    'GST registration & LUT for zero-rated exports',
    'RCMC from relevant Export Promotion Council (EPCH, CEPC…)',
    'Commercial invoice & packing list',
    'Shipping bill (ICEGATE)',
    'Certificate of Origin (preferential for FTA markets)',
    'Bill of lading / airway bill',
    'Pre-shipment inspection report (AQL)',
    'Fumigation & ISPM-15 certificate for wooden goods/packaging',
    'Product-specific: FSC, FSSAI, AYUSH, GoodWeave, OEKO-TEX as applicable',
  ],
  CN: [
    'Business licence with import/export rights',
    'Customs registration (China Customs)',
    'Commercial invoice & packing list',
    'Export customs declaration',
    'Certificate of Origin (CCPIT / Form E etc.)',
    'Bill of lading / airway bill',
    'Pre-shipment inspection report (AQL)',
    'CE / RoHS / FCC / UL test reports as per destination',
    'MSDS & UN38.3 for lithium batteries',
    'Fumigation certificate for wooden packaging',
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
