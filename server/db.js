import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// All live data (the SQLite database and uploaded files) lives in DATA_DIR. In production point HIMBRIDGE_DATA_DIR at a
// folder outside the deployed app, so redeploying the code never wipes accounts, products or orders.
export const DATA_DIR = process.env.HIMBRIDGE_DATA_DIR || join(root, 'data');
mkdirSync(join(DATA_DIR, 'uploads'), { recursive: true });
export const db = new DatabaseSync(process.env.HIMBRIDGE_DB || join(DATA_DIR, 'himbridge.db'));
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

// ---------- First run: create the Himbridge admin account (no demo data) ----------
// The admin login comes from HIMBRIDGE_ADMIN_EMAIL and HIMBRIDGE_ADMIN_PASSWORD; it is created once, when no admin exists.
// Vendors, buyers and logistics partners register themselves; products are listed by verified vendors.
if (!db.prepare("SELECT 1 FROM users WHERE role='admin'").get()) {
  const email = String(process.env.HIMBRIDGE_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.HIMBRIDGE_ADMIN_PASSWORD || '');
  if (email && password.length >= 8) {
    db.prepare("INSERT INTO users (role,name,email,pass_hash,company,country,email_verified) VALUES ('admin','Himbridge Operations',?,?,'Himbridge Global','India',1)")
      .run(email, hashPassword(password));
    console.log(`Created admin account ${email}`);
  } else {
    console.warn('No admin account yet: set HIMBRIDGE_ADMIN_EMAIL and HIMBRIDGE_ADMIN_PASSWORD (8+ characters) and restart.');
  }
}
if (!db.prepare('SELECT 1 FROM notices').get()) {
  const addNotice = db.prepare('INSERT INTO notices (title,body,tag) VALUES (?,?,?)');
  addNotice.run('Founding Vendor Programme open — free Gold tier for first 100 verified manufacturers', 'Apply from the vendor registration page. Verification within 7 working days.', 'Programme');
  addNotice.run('Advisory: verify current import duties before confirming US-bound orders', 'Tariff schedules change frequently. Use the landed-cost tool and confirm with your customs broker.', 'Advisory');
}
