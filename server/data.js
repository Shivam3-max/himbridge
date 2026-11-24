// Static reference data shared by the API and the seed.

export const NICHES = [
  // India
  { slug: 'handicrafts', name: 'Handicrafts & Home Décor', origin: 'IN', clusters: 'Moradabad, Jodhpur, Jaipur, Saharanpur, Agra', markets: 'USA, UK, Germany, UAE, Australia', demand: 5, margin: 5, ease: 4, edge: 5, phase: 1, hs: '8306, 4420, 6802, 6913', color: '#b45309' },
  { slug: 'wood-furniture', name: 'Solid Wood & Cane Furniture', origin: 'IN', clusters: 'Jodhpur, Saharanpur, Kerala', markets: 'USA, Netherlands, Germany, Australia', demand: 5, margin: 4, ease: 3, edge: 5, phase: 1, hs: '9403, 9401', color: '#7c4a1e' },
  { slug: 'rugs', name: 'Rugs & Carpets', origin: 'IN', clusters: 'Bhadohi, Mirzapur, Panipat, Jaipur', markets: 'USA, Germany, UK', demand: 4, margin: 5, ease: 3, edge: 5, phase: 1, hs: '5701, 5702, 5705', color: '#9f1239' },
  { slug: 'home-textiles', name: 'Home Textiles', origin: 'IN', clusters: 'Panipat, Karur, Solapur', markets: 'USA, UK, EU', demand: 5, margin: 3, ease: 4, edge: 4, phase: 1, hs: '6302, 6304, 6301', color: '#0f766e' },
  { slug: 'wellness', name: 'Ayurvedic, Herbal & Wellness', origin: 'IN', clusters: 'Kerala, Uttarakhand, Gujarat', markets: 'UAE, USA, UK', demand: 4, margin: 5, ease: 2, edge: 5, phase: 2, hs: '3004, 1211, 3301', color: '#15803d' },
  { slug: 'jewellery', name: 'Fashion Jewellery & Gemstones', origin: 'IN', clusters: 'Jaipur, Surat, Mumbai', markets: 'USA, UAE, Hong Kong', demand: 4, margin: 5, ease: 3, edge: 4, phase: 2, hs: '7117, 7103, 7113', color: '#a21caf' },
  { slug: 'leather', name: 'Leather Goods & Footwear', origin: 'IN', clusters: 'Kanpur, Agra, Chennai, Kolkata', markets: 'EU, USA, UK', demand: 4, margin: 4, ease: 3, edge: 4, phase: 2, hs: '4202, 6403', color: '#78350f' },
  { slug: 'spices', name: 'Spices & Specialty Foods', origin: 'IN', clusters: 'Kerala, Rajasthan, Gujarat', markets: 'GCC, USA, EU', demand: 5, margin: 3, ease: 2, edge: 5, phase: 3, hs: '0904, 0910, 0908', color: '#c2410c' },
  { slug: 'apparel', name: 'Sustainable Cotton Apparel', origin: 'IN', clusters: 'Tiruppur, Ludhiana, Jaipur', markets: 'EU, UK, USA', demand: 4, margin: 3, ease: 3, edge: 4, phase: 3, hs: '6109, 6204, 6205', color: '#1d4ed8' },
  // China
  { slug: 'led-solar', name: 'LED Lighting & Solar', origin: 'CN', clusters: 'Zhongshan, Ningbo, Shenzhen', markets: 'Africa, GCC, LATAM, South Asia', demand: 5, margin: 4, ease: 4, edge: 5, phase: 1, hs: '9405, 8541, 8539', color: '#ca8a04' },
  { slug: 'electronics', name: 'Electronics & Smart Accessories', origin: 'CN', clusters: 'Shenzhen, Dongguan', markets: 'Global, Africa, GCC, LATAM', demand: 5, margin: 3, ease: 4, edge: 5, phase: 2, hs: '8517, 8504, 8518', color: '#4338ca' },
  { slug: 'modern-furniture', name: 'Modern, Office & Outdoor Furniture', origin: 'CN', clusters: 'Foshan, Anji', markets: 'GCC, Africa, Australia', demand: 4, margin: 4, ease: 3, edge: 5, phase: 1, hs: '9401, 9403', color: '#334155' },
  { slug: 'home-kitchen', name: 'Home, Kitchen & Small Appliances', origin: 'CN', clusters: 'Ningbo, Yiwu, Guangzhou', markets: 'Global', demand: 5, margin: 3, ease: 4, edge: 5, phase: 1, hs: '8516, 7323, 3924', color: '#0369a1' },
  { slug: 'packaging', name: 'Packaging & Eco Packaging', origin: 'CN', clusters: 'Dongguan, Wenzhou', markets: 'Global', demand: 5, margin: 3, ease: 4, edge: 4, phase: 2, hs: '4819, 3923', color: '#4d7c0f' },
  { slug: 'hardware', name: 'Hardware, Tools & Building Materials', origin: 'CN', clusters: 'Yongkang, Foshan', markets: 'GCC, Africa, SE Asia', demand: 4, margin: 3, ease: 3, edge: 5, phase: 3, hs: '8205, 8302, 6907', color: '#57534e' },
  { slug: 'toys-festive', name: 'Toys, Festive & Party Décor', origin: 'CN', clusters: 'Yiwu, Shantou', markets: 'Global (seasonal)', demand: 4, margin: 3, ease: 3, edge: 5, phase: 3, hs: '9503, 9505', color: '#db2777' },
];

export const ORDER_FLOW = [
  { key: 'confirmed', label: 'Order confirmed' },
  { key: 'in_production', label: 'In production' },
  { key: 'qc_passed', label: 'QC inspection passed' },
  { key: 'shipped', label: 'Shipped / on vessel' },
  { key: 'customs', label: 'Destination customs' },
  { key: 'delivered', label: 'Delivered' },
];

// Which role may move an order into which status (admin may set any).
export const STATUS_OWNER = {
  in_production: 'vendor',
  qc_passed: 'vendor',
  shipped: 'logistics',
  customs: 'logistics',
  delivered: 'logistics',
};
