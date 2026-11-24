import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(root, 'data'), { recursive: true });
export const db = new DatabaseSync(process.env.HIMBRIDGE_DB || join(root, 'data', 'himbridge.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK (role IN ('admin','buyer','vendor','logistics')),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  pass_hash TEXT NOT NULL,
  company TEXT,
  country TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS vendors (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  origin TEXT NOT NULL CHECK (origin IN ('IN','CN')),
  cluster TEXT,
  niche TEXT,
  certifications TEXT,
  capacity TEXT,
  years INTEGER,
  about TEXT,
  verified TEXT NOT NULL DEFAULT 'pending' CHECK (verified IN ('pending','verified','suspended'))
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  niche TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  hs_code TEXT,
  moq INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'pcs',
  price_min REAL,
  price_max REAL,
  lead_days INTEGER,
  material TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS rfqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  niche TEXT NOT NULL,
  title TEXT NOT NULL,
  details TEXT,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  destination TEXT NOT NULL,
  target_price REAL,
  origin_pref TEXT NOT NULL DEFAULT 'ANY',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rfq_id INTEGER NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_price REAL NOT NULL,
  lead_days INTEGER NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (rfq_id, vendor_id)
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  rfq_id INTEGER REFERENCES rfqs(id),
  quote_id INTEGER REFERENCES quotes(id),
  buyer_id INTEGER NOT NULL REFERENCES users(id),
  vendor_id INTEGER NOT NULL REFERENCES users(id),
  logistics_id INTEGER REFERENCES users(id),
  title TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT,
  unit_price REAL NOT NULL,
  total REAL NOT NULL,
  destination TEXT,
  incoterm TEXT DEFAULT 'FOB',
  mode TEXT,
  origin_port TEXT,
  dest_port TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  by_user INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS notices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT,
  tag TEXT DEFAULT 'Notice',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires INTEGER NOT NULL
);
-- Uploaded files (KYC documents, product photos, QC photos, shipping documents). Bytes live in data/uploads/.
CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('kyc','product','qc','shipping','rfq')),
  ref_id INTEGER,
  label TEXT,
  name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  stored TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- One-time tokens for password reset and email verification (only the SHA-256 hash is stored).
CREATE TABLE IF NOT EXISTS tokens (
  hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('reset','verify')),
  expires INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);
-- Outgoing email. Until an SMTP/API provider is connected, mail is kept here and shown in Admin → Email outbox.
CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Milestone payments: 30% advance on confirmation, 70% balance after QC (before dispatch).
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('advance','balance')),
  pct INTEGER NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'due' CHECK (status IN ('due','submitted','received')),
  reference TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (order_id, stage)
);
`);
// Lightweight migration for databases created before email verification existed.
if (!db.prepare("SELECT 1 FROM pragma_table_info('users') WHERE name='email_verified'").get()) db.exec('ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0');

export const PAYMENT_PLAN = [['advance', 30], ['balance', 70]];
export function createPayments(orderId, total) {
  const ins = db.prepare('INSERT OR IGNORE INTO payments (order_id,stage,pct,amount) VALUES (?,?,?,?)');
  for (const [stage, pct] of PAYMENT_PLAN) ins.run(orderId, stage, pct, Math.round(total * pct) / 100);
}

export function hashPassword(pw) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(pw, salt, 64).toString('hex')}`;
}
export function checkPassword(pw, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, 'hex');
  const b = scryptSync(pw, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---------- Seed demo data on first run ----------
const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
if (count === 0) seed();

function seed() {
  const pw = hashPassword('Himbridge@123');
  const addUser = db.prepare('INSERT INTO users (role,name,email,pass_hash,company,country,phone) VALUES (?,?,?,?,?,?,?)');
  const addVendor = db.prepare('INSERT INTO vendors (user_id,origin,cluster,niche,certifications,capacity,years,about,verified) VALUES (?,?,?,?,?,?,?,?,?)');
  const addProduct = db.prepare('INSERT INTO products (vendor_id,niche,title,description,hs_code,moq,unit,price_min,price_max,lead_days,material) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  const uid = (r) => Number(r.lastInsertRowid);

  db.exec('BEGIN');
  addUser.run('admin', 'Himbridge Operations', 'admin@himbridge.trade', pw, 'Himbridge Global', 'India', '+91 11 4000 0000');
  const buyer = uid(addUser.run('buyer', 'Emily Carter', 'buyer@himbridge.trade', pw, 'Carter Home Co.', 'United States', '+1 415 555 0142'));
  const buyer2 = uid(addUser.run('buyer', 'Omar Al Mansoori', 'omar@gulfliving.ae', pw, 'Gulf Living Trading LLC', 'United Arab Emirates', '+971 4 555 0199'));
  const logi = uid(addUser.run('logistics', 'Rakesh Menon', 'logistics@himbridge.trade', pw, 'BlueWave Freight & CHA', 'India', '+91 22 6600 1234'));

  const vendors = [
    ['vendor.in@himbridge.trade', 'Arjun Sharma', 'Moradabad Brass Works', 'IN', 'Moradabad, UP', 'handicrafts', 'IEC, GST, EPCH, SEDEX', '40,000 pcs / month', 18, 'Third-generation brass & metal décor manufacturer supplying US and EU retailers.', 'verified'],
    ['jodhpur@himbridge.trade', 'Meera Rathore', 'Thar Woodcraft Exports', 'IN', 'Jodhpur, Rajasthan', 'wood-furniture', 'IEC, GST, FSC, VRIKSH', '12 containers / month', 22, 'Sheesham & mango wood furniture, KD and assembled, for USA and Australia.', 'verified'],
    ['bhadohi@himbridge.trade', 'Imran Ansari', 'Ganga Loom Carpets', 'IN', 'Bhadohi, UP', 'rugs', 'IEC, GST, CEPC, GoodWeave', '8,000 sq m / month', 15, 'Hand-knotted, hand-tufted and flat-weave rugs in wool, jute and cotton.', 'verified'],
    ['panipat@himbridge.trade', 'Sunita Goyal', 'Panipat Home Textiles', 'IN', 'Panipat, Haryana', 'home-textiles', 'IEC, GST, OEKO-TEX, GOTS', '60,000 pcs / month', 11, 'Throws, cushion covers, bedding and table linen in cotton and recycled yarn.', 'verified'],
    ['kerala@himbridge.trade', 'Dr. Anil Nair', 'Vedic Roots Herbals', 'IN', 'Kochi, Kerala', 'wellness', 'IEC, AYUSH, GMP, FSSAI', '2 tonnes / month', 9, 'Ayurvedic oils, herbal powders and wellness blends — private label ready.', 'pending'],
    ['vendor.cn@himbridge.trade', 'Li Wei', 'Zhongshan Brightway Lighting', 'CN', 'Zhongshan, Guangdong', 'led-solar', 'CE, RoHS, ISO 9001, UL', '200,000 pcs / month', 14, 'LED panels, solar street lights and smart bulbs for Africa, GCC and LATAM.', 'verified'],
    ['foshan@himbridge.trade', 'Chen Jing', 'Foshan Linear Furniture', 'CN', 'Foshan, Guangdong', 'modern-furniture', 'ISO 9001, BIFMA, FSC', '30 containers / month', 16, 'Office chairs, workstations and aluminium outdoor furniture.', 'verified'],
    ['ningbo@himbridge.trade', 'Zhang Hao', 'Ningbo Kitchenpro Appliances', 'CN', 'Ningbo, Zhejiang', 'home-kitchen', 'CE, CB, GS, BSCI', '150,000 pcs / month', 12, 'Kettles, air fryers, cookware and kitchen storage — OEM/ODM.', 'verified'],
    ['shenzhen@himbridge.trade', 'Wang Fang', 'Shenzhen Nexa Electronics', 'CN', 'Shenzhen, Guangdong', 'electronics', 'CE, FCC, RoHS, ISO 9001', '500,000 pcs / month', 8, 'Chargers, power banks, earbuds and smart accessories.', 'pending'],
  ];
  const vid = {};
  for (const v of vendors) {
    const id = uid(addUser.run('vendor', v[1], v[0], pw, v[2], v[3] === 'IN' ? 'India' : 'China', ''));
    addVendor.run(id, v[3], v[4], v[5], v[6], v[7], v[8], v[9], v[10]);
    vid[v[0]] = id;
  }

  const P = (email, niche, title, desc, hs, moq, unit, pmin, pmax, lead, mat) =>
    addProduct.run(vid[email], niche, title, desc, hs, moq, unit, pmin, pmax, lead, mat);
  P('vendor.in@himbridge.trade', 'handicrafts', 'Hand-hammered Brass Planter Set (3 pcs)', 'Antique gold finish, lacquer coated, nested set.', '8306.29', 200, 'sets', 14, 22, 45, 'Brass');
  P('vendor.in@himbridge.trade', 'handicrafts', 'Engraved Brass Candle Holders', 'Pair of temple-style candle stands with etched motifs.', '8306.29', 300, 'pairs', 6.5, 11, 40, 'Brass');
  P('vendor.in@himbridge.trade', 'handicrafts', 'Aluminium Recycled Décor Bowl', 'Sand-cast recycled aluminium bowl, nickel finish.', '7615.10', 500, 'pcs', 4.2, 7.8, 35, 'Recycled aluminium');
  P('jodhpur@himbridge.trade', 'wood-furniture', 'Sheesham Wood Sideboard 160 cm', 'Solid sheesham, 4 doors, natural honey finish, KD packing.', '9403.60', 20, 'pcs', 210, 280, 60, 'Sheesham wood');
  P('jodhpur@himbridge.trade', 'wood-furniture', 'Mango Wood Dining Table 6-Seater', 'Live-edge top, iron hairpin legs.', '9403.60', 15, 'pcs', 185, 240, 55, 'Mango wood, iron');
  P('jodhpur@himbridge.trade', 'wood-furniture', 'Cane & Teak Lounge Chair', 'Hand-woven natural cane with solid teak frame.', '9401.69', 30, 'pcs', 95, 130, 50, 'Teak, cane');
  P('bhadohi@himbridge.trade', 'rugs', 'Hand-knotted Wool Rug 8x10 ft', '100 knots/sq inch, New Zealand wool, custom colours.', '5701.10', 10, 'pcs', 320, 520, 75, 'Wool');
  P('bhadohi@himbridge.trade', 'rugs', 'Braided Jute Round Rug 6 ft', 'Natural jute, eco-friendly, hand-braided.', '5702.39', 50, 'pcs', 28, 42, 40, 'Jute');
  P('bhadohi@himbridge.trade', 'rugs', 'Flat-weave Cotton Kilim 5x8 ft', 'Reversible, machine washable, geometric designs.', '5702.99', 60, 'pcs', 34, 55, 45, 'Cotton');
  P('panipat@himbridge.trade', 'home-textiles', 'Recycled Cotton Throw 130x170', 'Herringbone weave with fringes, GRS certified yarn.', '6301.40', 500, 'pcs', 6.8, 9.5, 40, 'Recycled cotton');
  P('panipat@himbridge.trade', 'home-textiles', 'Block-printed Cushion Covers 45x45', 'Hand block print, natural dyes, envelope closure.', '6304.92', 1000, 'pcs', 2.1, 3.4, 35, 'Cotton');
  P('panipat@himbridge.trade', 'home-textiles', 'Organic Cotton Bedding Set (Queen)', 'GOTS organic percale, duvet + 2 shams.', '6302.21', 300, 'sets', 24, 34, 50, 'Organic cotton');
  P('kerala@himbridge.trade', 'wellness', 'Ashwagandha Root Powder — Bulk', 'Lab tested, organic certified, 25 kg bags.', '1211.90', 100, 'kg', 9, 14, 21, 'Herbal');
  P('vendor.cn@himbridge.trade', 'led-solar', 'All-in-One Solar Street Light 100W', 'LiFePO4 battery, motion sensor, IP65.', '9405.42', 100, 'pcs', 38, 55, 25, 'Aluminium');
  P('vendor.cn@himbridge.trade', 'led-solar', 'LED Panel Light 600x600 40W', 'Backlit, 4000K, flicker-free driver, 5-yr warranty.', '9405.11', 500, 'pcs', 7.5, 11, 20, 'Aluminium, PS');
  P('vendor.cn@himbridge.trade', 'led-solar', 'Smart Wi-Fi LED Bulb E27', 'RGBCW, app + voice control, Tuya platform.', '8539.52', 2000, 'pcs', 1.9, 2.8, 25, 'PC');
  P('foshan@himbridge.trade', 'modern-furniture', 'Ergonomic Mesh Office Chair', 'Adjustable lumbar, 4D arms, class-4 gas lift.', '9401.31', 100, 'pcs', 42, 68, 30, 'Mesh, nylon');
  P('foshan@himbridge.trade', 'modern-furniture', 'Aluminium Outdoor Sofa Set (5 seat)', 'Powder-coated frame, quick-dry cushions.', '9401.79', 10, 'sets', 380, 520, 40, 'Aluminium');
  P('ningbo@himbridge.trade', 'home-kitchen', 'Digital Air Fryer 5.5 L', '1700W, 8 presets, non-stick basket, CE/GS.', '8516.60', 500, 'pcs', 18, 24, 35, 'PP, steel');
  P('ningbo@himbridge.trade', 'home-kitchen', 'Stainless Steel Cookware Set 10 pcs', 'Tri-ply base, induction ready.', '7323.93', 300, 'sets', 28, 39, 40, 'SS 304');
  P('ningbo@himbridge.trade', 'home-kitchen', 'Bamboo Kitchen Storage Jars (set of 4)', 'Borosilicate glass with bamboo lids.', '7013.49', 1000, 'sets', 4.6, 6.9, 30, 'Glass, bamboo');
  P('shenzhen@himbridge.trade', 'electronics', 'GaN Fast Charger 65W', 'USB-C PD 3.0, foldable plug.', '8504.40', 1000, 'pcs', 5.2, 7.4, 20, 'PC');

  const addRfq = db.prepare('INSERT INTO rfqs (buyer_id,niche,title,details,quantity,unit,destination,target_price,origin_pref,status) VALUES (?,?,?,?,?,?,?,?,?,?)');
  const r1 = uid(addRfq.run(buyer, 'handicrafts', 'Brass planters for spring collection', 'Antique gold & matte black finishes, 3 sizes, private label tags.', 1200, 'sets', 'Los Angeles, USA', 16, 'IN', 'open'));
  const r2 = uid(addRfq.run(buyer, 'wood-furniture', 'Solid wood sideboards — 2 x 40HC', 'Sheesham or acacia, 150–180 cm, FSC preferred.', 120, 'pcs', 'Los Angeles, USA', 230, 'IN', 'awarded'));
  uid(addRfq.run(buyer2, 'led-solar', 'Solar street lights for municipal project', '100W–150W all-in-one, 3-night autonomy, IP66.', 2500, 'pcs', 'Jebel Ali, UAE', 45, 'CN', 'open'));
  const r4 = uid(addRfq.run(buyer2, 'home-kitchen', 'Air fryers for Ramadan retail promo', 'Arabic packaging, GCC plug, SASO certification.', 3000, 'pcs', 'Jebel Ali, UAE', 20, 'ANY', 'awarded'));

  const addQuote = db.prepare('INSERT INTO quotes (rfq_id,vendor_id,unit_price,lead_days,note,status) VALUES (?,?,?,?,?,?)');
  addQuote.run(r1, vid['vendor.in@himbridge.trade'], 15.4, 45, 'Includes lacquer coating and hang-tags. Samples in 10 days.', 'submitted');
  const q2 = uid(addQuote.run(r2, vid['jodhpur@himbridge.trade'], 226, 60, 'FSC sheesham, KD packing, 60 pcs per 40HC.', 'accepted'));
  const q4 = uid(addQuote.run(r4, vid['ningbo@himbridge.trade'], 19.2, 35, 'SASO + G-Mark included, Arabic gift box.', 'accepted'));

  const addOrder = db.prepare(`INSERT INTO orders (code,rfq_id,quote_id,buyer_id,vendor_id,logistics_id,title,quantity,unit,unit_price,total,destination,incoterm,mode,origin_port,dest_port,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const o1 = uid(addOrder.run('HBG-2026-0001', r2, q2, buyer, vid['jodhpur@himbridge.trade'], logi, 'Solid wood sideboards — 2 x 40HC', 120, 'pcs', 226, 27120, 'Los Angeles, USA', 'FOB', 'Sea — 2 x 40HC', 'Mundra, India', 'Los Angeles, USA', 'shipped'));
  const o2 = uid(addOrder.run('HBG-2026-0002', r4, q4, buyer2, vid['ningbo@himbridge.trade'], null, 'Air fryers for Ramadan retail promo', 3000, 'pcs', 19.2, 57600, 'Jebel Ali, UAE', 'CIF', null, null, null, 'in_production'));

  const addMs = db.prepare("INSERT INTO milestones (order_id,status,note,by_user,created_at) VALUES (?,?,?,?,datetime('now', ?))");
  addMs.run(o1, 'confirmed', 'Buyer accepted quotation. 30% advance received.', buyer, '-40 days');
  addMs.run(o1, 'in_production', 'Timber seasoning complete, assembly started.', vid['jodhpur@himbridge.trade'], '-34 days');
  addMs.run(o1, 'qc_passed', 'Pre-shipment inspection AQL 2.5 — passed.', vid['jodhpur@himbridge.trade'], '-12 days');
  addMs.run(o1, 'shipped', 'Loaded at Mundra. Vessel MSC AURORA, ETA 24 days.', logi, '-6 days');
  addMs.run(o2, 'confirmed', 'Buyer accepted quotation. LC opened.', buyer2, '-15 days');
  addMs.run(o2, 'in_production', 'Mass production 40% complete.', vid['ningbo@himbridge.trade'], '-5 days');

  const addNotice = db.prepare("INSERT INTO notices (title,body,tag,created_at) VALUES (?,?,?,datetime('now', ?))");
  addNotice.run('Founding Vendor Programme open — free Gold tier for first 100 verified manufacturers', 'Apply from the vendor registration page. Verification within 7 working days.', 'Programme', '-1 days');
  addNotice.run('Himbridge pavilion at the spring home & lifestyle fair — buyer meetings open', 'Book a slot with our sourcing desk to meet verified handicraft and furniture vendors.', 'Trade Fair', '-3 days');
  addNotice.run('Factory visit tour for buyers — registrations open', 'Join a Himbridge-guided tour of audited Engineered-collection factories, timed with the spring trade-fair season.', 'Trade Fair', '-6 days');
  addNotice.run('Advisory: verify current import duties before confirming US-bound orders', 'Tariff schedules change frequently. Use the landed-cost tool and confirm with your customs broker.', 'Advisory', '-8 days');
  addNotice.run('New category live: LED Lighting & Solar — 40+ SKUs onboarded', 'Africa and GCC buyers can now raise RFQs for solar street lights and LED panels.', 'Update', '-12 days');
  createPayments(o1, 27120); createPayments(o2, 57600);
  db.prepare("UPDATE payments SET status='received', reference='SWIFT CHAS0US33 · 41882' WHERE order_id=?").run(o1);
  db.prepare("UPDATE payments SET status='received', reference='LC 00921/AE' WHERE order_id=? AND stage='advance'").run(o2);
  db.exec('UPDATE users SET email_verified=1');
  db.exec('COMMIT');
  console.log('Seeded demo data. All demo passwords: Himbridge@123');
}
