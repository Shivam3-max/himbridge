import { createServer } from 'node:http';
import { readFile, stat, writeFile, unlink, mkdir } from 'node:fs/promises';
import { join, normalize, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, createHash } from 'node:crypto';
import { db, hashPassword, checkPassword, createPayments } from './db.js';
import { NICHES, ORDER_FLOW, STATUS_OWNER } from './data.js';

const PORT = Number(process.env.PORT) || 3870;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const UPLOADS = join(ROOT, 'data', 'uploads');
const PUBLIC_URL = process.env.PUBLIC_URL || '';
const SESSION_DAYS = 7;
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon', '.json': 'application/json' };

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const fail = (status, msg) => { throw new HttpError(status, msg); };
const nicheSlugs = new Set(NICHES.map((n) => n.slug));
const PRODUCT_IMAGE = "(SELECT '/files/' || f.id FROM files f WHERE f.kind='product' AND f.ref_id=p.id ORDER BY f.id LIMIT 1) AS image";
const flowKeys = ORDER_FLOW.map((s) => s.key);

// ---------- helpers ----------
function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(body));
}
async function readJson(req, limit = 1e6) {
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > limit) fail(413, 'File or payload too large'); chunks.push(c); }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { fail(400, 'Invalid JSON'); }
}
function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).filter((p) => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
}
function currentUser(req) {
  const token = cookies(req).hbg_sid;
  if (!token) return null;
  const row = db.prepare('SELECT u.id,u.role,u.name,u.email,u.company,u.country,u.phone,u.status,u.email_verified,s.expires FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?').get(token);
  if (!row || row.expires < Date.now() || row.status !== 'active') return null;
  delete row.expires;
  if (row.role === 'vendor') row.vendor = db.prepare('SELECT * FROM vendors WHERE user_id=?').get(row.id);
  return row;
}
function requireRole(user, ...roles) {
  if (!user) fail(401, 'Please log in');
  if (roles.length && !roles.includes(user.role)) fail(403, 'Not allowed for your account type');
}
const str = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : NaN; };
const plain = (rows) => rows.map((r) => ({ ...r }));
function sessionCookie(token, maxAge) {
  return `hbg_sid=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}
function startSession(userId) {
  const token = randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token,user_id,expires) VALUES (?,?,?)').run(token, userId, Date.now() + SESSION_DAYS * 864e5);
  return sessionCookie(token, SESSION_DAYS * 86400);
}
function orderScope(user) {
  if (user.role === 'admin') return ['1=1', []];
  if (user.role === 'buyer') return ['o.buyer_id=?', [user.id]];
  if (user.role === 'vendor') return ['o.vendor_id=?', [user.id]];
  return ['o.logistics_id=?', [user.id]];
}
const ORDER_SELECT = `SELECT o.*, b.company AS buyer_company, b.country AS buyer_country, v.company AS vendor_company, vd.origin AS vendor_origin, l.company AS logistics_company
  FROM orders o JOIN users b ON b.id=o.buyer_id JOIN users v ON v.id=o.vendor_id LEFT JOIN vendors vd ON vd.user_id=o.vendor_id LEFT JOIN users l ON l.id=o.logistics_id`;
function withMilestones(orders) {
  const q = db.prepare('SELECT m.status,m.note,m.created_at,u.company AS by_company FROM milestones m LEFT JOIN users u ON u.id=m.by_user WHERE m.order_id=? ORDER BY m.created_at, m.id');
  return orders.map((o) => ({ ...o, milestones: plain(q.all(o.id)) }));
}
function withOrderExtras(orders) {
  const pay = db.prepare("SELECT id,stage,pct,amount,status,reference,updated_at FROM payments WHERE order_id=? ORDER BY CASE stage WHEN 'advance' THEN 0 ELSE 1 END");
  const docs = db.prepare("SELECT f.id,f.kind,f.label,f.name,f.mime,f.size,f.created_at,u.company AS by_company FROM files f JOIN users u ON u.id=f.owner_id WHERE f.kind IN ('qc','shipping') AND f.ref_id=? ORDER BY f.id");
  return withMilestones(orders).map((o) => ({ ...o, payments: plain(pay.all(o.id)), documents: plain(docs.all(o.id)) }));
}

// ---------- routes ----------
const routes = [];
const route = (method, path, handler) => {
  const keys = [];
  const re = new RegExp('^' + path.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
  routes.push({ method, re, keys, handler });
};

route('GET', '/api/meta', () => ({ niches: NICHES, orderFlow: ORDER_FLOW, statusOwner: STATUS_OWNER }));

route('GET', '/api/logistics-partners', ({ user }) => {
  requireRole(user, 'admin');
  return plain(db.prepare("SELECT id, company, country FROM users WHERE role='logistics' AND status='active' ORDER BY company").all());
});

route('GET', '/api/stats', () => {
  const one = (sql) => db.prepare(sql).get().n;
  return {
    vendors: one("SELECT COUNT(*) n FROM vendors WHERE verified='verified'"),
    vendorsIN: one("SELECT COUNT(*) n FROM vendors WHERE verified='verified' AND origin='IN'"),
    vendorsCN: one("SELECT COUNT(*) n FROM vendors WHERE verified='verified' AND origin='CN'"),
    clusters: one("SELECT COUNT(DISTINCT cluster) n FROM vendors WHERE verified='verified' AND cluster<>''"),
    products: one("SELECT COUNT(*) n FROM products p JOIN vendors v ON v.user_id=p.vendor_id WHERE p.status='active' AND v.verified='verified'"),
    buyers: one("SELECT COUNT(*) n FROM users WHERE role='buyer'"),
    openRfqs: one("SELECT COUNT(*) n FROM rfqs WHERE status='open'"),
    orders: one('SELECT COUNT(*) n FROM orders'),
    tradeValue: db.prepare('SELECT COALESCE(SUM(total),0) n FROM orders').get().n,
    niches: NICHES.length,
  };
});

route('GET', '/api/notices', () => plain(db.prepare('SELECT * FROM notices ORDER BY created_at DESC, id DESC LIMIT 20').all()));
route('POST', '/api/notices', async ({ user, body }) => {
  requireRole(user, 'admin');
  const title = str(body.title, 200);
  if (!title) fail(400, 'Title is required');
  db.prepare('INSERT INTO notices (title,body,tag) VALUES (?,?,?)').run(title, str(body.body, 2000), str(body.tag, 30) || 'Notice');
  return { ok: true };
});

// ----- auth -----
route('POST', '/api/register', async ({ req, body }) => {
  const role = body.role;
  if (!['buyer', 'vendor', 'logistics'].includes(role)) fail(400, 'Choose an account type');
  const name = str(body.name, 120), email = str(body.email, 160).toLowerCase(), password = String(body.password || '');
  const company = str(body.company, 160), country = str(body.country, 80);
  if (!name || !company || !country) fail(400, 'Name, company and country are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'Enter a valid email');
  if (password.length < 8) fail(400, 'Password must be at least 8 characters');
  if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email)) fail(409, 'An account with this email already exists');
  if (role === 'vendor') {
    if (!['IN', 'CN'].includes(body.origin)) fail(400, 'Choose your factory country');
    if (!nicheSlugs.has(body.niche)) fail(400, 'Choose your primary niche');
  }
  db.exec('BEGIN');
  try {
    const id = Number(db.prepare('INSERT INTO users (role,name,email,pass_hash,company,country,phone) VALUES (?,?,?,?,?,?,?)')
      .run(role, name, email, hashPassword(password), company, country, str(body.phone, 40)).lastInsertRowid);
    if (role === 'vendor') {
      db.prepare('INSERT INTO vendors (user_id,origin,cluster,niche,certifications,capacity,years,about) VALUES (?,?,?,?,?,?,?,?)')
        .run(id, body.origin, str(body.cluster, 120), body.niche, str(body.certifications, 300), str(body.capacity, 120), Math.max(0, Math.floor(num(body.years) || 0)), str(body.about, 1000));
    }
    db.exec('COMMIT');
    sendVerification(req, { id, name, email });
    return { ok: true, _cookie: startSession(id) };
  } catch (e) { db.exec('ROLLBACK'); throw e; }
});

route('POST', '/api/login', async ({ body }) => {
  const email = str(body.email, 160).toLowerCase();
  const row = db.prepare('SELECT id,pass_hash,status FROM users WHERE email=?').get(email);
  if (!row || !checkPassword(String(body.password || ''), row.pass_hash)) fail(401, 'Incorrect email or password');
  if (row.status !== 'active') fail(403, 'This account is disabled. Contact the Himbridge help desk.');
  return { ok: true, _cookie: startSession(row.id) };
});

route('POST', '/api/logout', ({ req }) => {
  const token = cookies(req).hbg_sid;
  if (token) db.prepare('DELETE FROM sessions WHERE token=?').run(token);
  return { ok: true, _cookie: sessionCookie('', 0) };
});

route('GET', '/api/me', ({ user }) => ({ user }));

// ----- catalog -----
route('GET', '/api/products', ({ query }) => {
  const where = ["p.status='active'", "v.verified='verified'"]; const args = [];
  if (query.get('niche')) { where.push('p.niche=?'); args.push(query.get('niche')); }
  if (['IN', 'CN'].includes(query.get('origin'))) { where.push('v.origin=?'); args.push(query.get('origin')); }
  if (query.get('q')) { where.push('(p.title LIKE ? OR p.description LIKE ? OR u.company LIKE ?)'); const q = `%${query.get('q')}%`; args.push(q, q, q); }
  return plain(db.prepare(`SELECT p.*, u.company AS vendor_company, v.origin, v.cluster, v.certifications, ${PRODUCT_IMAGE} FROM products p
    JOIN users u ON u.id=p.vendor_id JOIN vendors v ON v.user_id=p.vendor_id WHERE ${where.join(' AND ')} ORDER BY p.created_at DESC, p.id DESC`).all(...args));
});

route('GET', '/api/vendors', () => plain(db.prepare(`SELECT u.id,u.company,u.country,v.origin,v.cluster,v.niche,v.certifications,v.capacity,v.years,v.about,
  (SELECT COUNT(*) FROM products p WHERE p.vendor_id=u.id AND p.status='active') AS product_count
  FROM vendors v JOIN users u ON u.id=v.user_id WHERE v.verified='verified' ORDER BY u.company`).all()));

route('GET', '/api/my/products', ({ user }) => {
  requireRole(user, 'vendor');
  return plain(db.prepare(`SELECT p.*, ${PRODUCT_IMAGE} FROM products p WHERE vendor_id=? ORDER BY id DESC`).all(user.id));
});

route('POST', '/api/products', async ({ user, body }) => {
  requireRole(user, 'vendor');
  const title = str(body.title, 200);
  if (!title) fail(400, 'Product title is required');
  if (!nicheSlugs.has(body.niche)) fail(400, 'Choose a niche');
  const moq = Math.floor(num(body.moq)), pmin = num(body.price_min), pmax = num(body.price_max), lead = Math.floor(num(body.lead_days));
  if (!(moq > 0)) fail(400, 'MOQ must be a positive number');
  if (!(pmin > 0) || !(pmax >= pmin)) fail(400, 'Enter a valid FOB price range (max ≥ min)');
  if (!(lead > 0)) fail(400, 'Lead time must be a positive number of days');
  const r = db.prepare('INSERT INTO products (vendor_id,niche,title,description,hs_code,moq,unit,price_min,price_max,lead_days,material) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(user.id, body.niche, title, str(body.description, 1000), str(body.hs_code, 20), moq, str(body.unit, 20) || 'pcs', pmin, pmax, lead, str(body.material, 120));
  return { ok: true, id: Number(r.lastInsertRowid) };
});

route('DELETE', '/api/products/:id', ({ user, params }) => {
  requireRole(user, 'vendor', 'admin');
  const r = user.role === 'admin'
    ? db.prepare('DELETE FROM products WHERE id=?').run(params.id)
    : db.prepare('DELETE FROM products WHERE id=? AND vendor_id=?').run(params.id, user.id);
  if (!r.changes) fail(404, 'Product not found');
  return { ok: true };
});

// ----- RFQs & quotes -----
route('POST', '/api/rfqs', async ({ user, body }) => {
  requireRole(user, 'buyer');
  const title = str(body.title, 200), destination = str(body.destination, 120);
  const quantity = Math.floor(num(body.quantity));
  if (!title || !destination) fail(400, 'Title and destination are required');
  if (!nicheSlugs.has(body.niche)) fail(400, 'Choose a niche');
  if (!(quantity > 0)) fail(400, 'Quantity must be a positive number');
  const target = body.target_price === '' || body.target_price == null ? null : num(body.target_price);
  if (target !== null && !(target > 0)) fail(400, 'Target price must be positive');
  const origin = ['IN', 'CN'].includes(body.origin_pref) ? body.origin_pref : 'ANY';
  const r = db.prepare('INSERT INTO rfqs (buyer_id,niche,title,details,quantity,unit,destination,target_price,origin_pref) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(user.id, body.niche, title, str(body.details, 2000), quantity, str(body.unit, 20) || 'pcs', destination, target, origin);
  return { ok: true, id: Number(r.lastInsertRowid) };
});

route('GET', '/api/rfqs', ({ user }) => {
  requireRole(user);
  const base = `SELECT r.*, u.company AS buyer_company, u.country AS buyer_country,
    (SELECT COUNT(*) FROM quotes q WHERE q.rfq_id=r.id) AS quote_count,
    (SELECT json_group_array(json_object('id', f.id, 'name', f.name, 'mime', f.mime)) FROM files f WHERE f.kind='rfq' AND f.ref_id=r.id) AS attachments
    FROM rfqs r JOIN users u ON u.id=r.buyer_id`;
  let rows;
  if (user.role === 'buyer') rows = db.prepare(`${base} WHERE r.buyer_id=? ORDER BY r.id DESC`).all(user.id);
  else if (user.role === 'admin') rows = db.prepare(`${base} ORDER BY r.id DESC`).all();
  else if (user.role === 'vendor') {
    rows = db.prepare(`${base} WHERE r.status='open' AND (r.origin_pref='ANY' OR r.origin_pref=?) ORDER BY (r.niche=?) DESC, r.id DESC`).all(user.vendor.origin, user.vendor.niche);
    const mine = db.prepare('SELECT * FROM quotes WHERE rfq_id=? AND vendor_id=?');
    return rows.map((r) => ({ ...r, my_quote: mine.get(r.id, user.id) || null }));
  } else fail(403, 'Not allowed for your account type');
  if (user.role === 'buyer' || user.role === 'admin') {
    const q = db.prepare(`SELECT q.*, u.company AS vendor_company, v.origin, v.cluster, v.certifications FROM quotes q
      JOIN users u ON u.id=q.vendor_id JOIN vendors v ON v.user_id=q.vendor_id WHERE q.rfq_id=? ORDER BY q.unit_price`);
    return rows.map((r) => ({ ...r, quotes: plain(q.all(r.id)) }));
  }
});

route('POST', '/api/rfqs/:id/quotes', async ({ user, params, body }) => {
  requireRole(user, 'vendor');
  if (user.vendor.verified !== 'verified') fail(403, 'Your vendor profile must be verified before you can quote');
  const rfq = db.prepare('SELECT * FROM rfqs WHERE id=?').get(params.id);
  if (!rfq || rfq.status !== 'open') fail(404, 'This RFQ is not open');
  if (rfq.origin_pref !== 'ANY' && rfq.origin_pref !== user.vendor.origin) fail(403, 'This RFQ is limited to a different collection');
  const price = num(body.unit_price), lead = Math.floor(num(body.lead_days));
  if (!(price > 0) || !(lead > 0)) fail(400, 'Enter a valid unit price and lead time');
  db.prepare(`INSERT INTO quotes (rfq_id,vendor_id,unit_price,lead_days,note) VALUES (?,?,?,?,?)
    ON CONFLICT(rfq_id,vendor_id) DO UPDATE SET unit_price=excluded.unit_price, lead_days=excluded.lead_days, note=excluded.note, created_at=datetime('now')`)
    .run(rfq.id, user.id, price, lead, str(body.note, 1000));
  return { ok: true };
});

route('POST', '/api/quotes/:id/accept', ({ user, params }) => {
  requireRole(user, 'buyer');
  const q = db.prepare('SELECT q.*, r.buyer_id, r.title, r.quantity, r.unit, r.destination, r.status AS rfq_status FROM quotes q JOIN rfqs r ON r.id=q.rfq_id WHERE q.id=?').get(params.id);
  if (!q || q.buyer_id !== user.id) fail(404, 'Quote not found');
  if (q.rfq_status !== 'open') fail(409, 'This RFQ has already been awarded');
  db.exec('BEGIN');
  try {
    db.prepare("UPDATE quotes SET status = CASE WHEN id=? THEN 'accepted' ELSE 'rejected' END WHERE rfq_id=?").run(q.id, q.rfq_id);
    db.prepare("UPDATE rfqs SET status='awarded' WHERE id=?").run(q.rfq_id);
    const total = Math.round(q.unit_price * q.quantity * 100) / 100;
    const oid = Number(db.prepare('INSERT INTO orders (rfq_id,quote_id,buyer_id,vendor_id,title,quantity,unit,unit_price,total,destination) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(q.rfq_id, q.id, user.id, q.vendor_id, q.title, q.quantity, q.unit, q.unit_price, total, q.destination).lastInsertRowid);
    const code = `HBG-${new Date().getFullYear()}-${String(oid).padStart(4, '0')}`;
    db.prepare('UPDATE orders SET code=? WHERE id=?').run(code, oid);
    db.prepare("INSERT INTO milestones (order_id,status,note,by_user) VALUES (?,'confirmed','Buyer accepted quotation.',?)").run(oid, user.id);
    createPayments(oid, total);
    db.exec('COMMIT');
    return { ok: true, code };
  } catch (e) { db.exec('ROLLBACK'); throw e; }
});

// ----- orders & logistics -----
route('GET', '/api/orders', ({ user }) => {
  requireRole(user);
  const [w, a] = orderScope(user);
  return withOrderExtras(plain(db.prepare(`${ORDER_SELECT} WHERE ${w} ORDER BY o.id DESC`).all(...a)));
});

route('POST', '/api/orders/:id/status', async ({ user, params, body }) => {
  requireRole(user, 'vendor', 'logistics', 'admin');
  const [w, a] = orderScope(user);
  const order = db.prepare(`SELECT o.* FROM orders o WHERE o.id=? AND ${w}`).get(params.id, ...a);
  if (!order) fail(404, 'Order not found');
  const next = body.status;
  if (!flowKeys.includes(next) || next === 'confirmed') fail(400, 'Unknown status');
  if (user.role !== 'admin' && STATUS_OWNER[next] !== user.role) fail(403, 'This milestone is updated by another party');
  if (flowKeys.indexOf(next) !== flowKeys.indexOf(order.status) + 1 && user.role !== 'admin') fail(409, 'Milestones must be updated in order');
  if (STATUS_OWNER[next] === 'logistics' && !order.logistics_id) fail(409, 'Assign a logistics partner first');
  const paid = (stage) => db.prepare("SELECT 1 FROM payments WHERE order_id=? AND stage=? AND status='received'").get(order.id, stage);
  if (user.role !== 'admin' && next === 'in_production' && !paid('advance')) fail(409, 'Production starts once the advance payment is confirmed');
  if (user.role !== 'admin' && next === 'shipped' && !paid('balance')) fail(409, 'Dispatch is released once the balance payment is confirmed');
  db.prepare('UPDATE orders SET status=? WHERE id=?').run(next, order.id);
  db.prepare('INSERT INTO milestones (order_id,status,note,by_user) VALUES (?,?,?,?)').run(order.id, next, str(body.note, 500), user.id);
  return { ok: true };
});

route('POST', '/api/orders/:id/assign', async ({ user, params, body }) => {
  requireRole(user, 'admin');
  const lp = db.prepare("SELECT id FROM users WHERE id=? AND role='logistics'").get(num(body.logistics_id));
  if (!lp) fail(400, 'Choose a logistics partner');
  const incoterm = ['EXW', 'FOB', 'CIF', 'CFR', 'DAP', 'DDP'].includes(body.incoterm) ? body.incoterm : 'FOB';
  const r = db.prepare('UPDATE orders SET logistics_id=?, mode=?, origin_port=?, dest_port=?, incoterm=? WHERE id=?')
    .run(lp.id, str(body.mode, 80), str(body.origin_port, 80), str(body.dest_port, 80), incoterm, params.id);
  if (!r.changes) fail(404, 'Order not found');
  return { ok: true };
});

route('GET', '/api/track/:code', ({ params }) => {
  const o = db.prepare(`SELECT o.id,o.code,o.title,o.status,o.destination,o.incoterm,o.mode,o.origin_port,o.dest_port,o.created_at,vd.origin AS vendor_origin
    FROM orders o LEFT JOIN vendors vd ON vd.user_id=o.vendor_id WHERE o.code=?`).get(String(params.code).toUpperCase());
  if (!o) fail(404, 'No shipment found for this tracking number');
  const [full] = withMilestones([{ ...o }]);
  full.milestones = full.milestones.map(({ by_company, ...m }) => m); // hide party names publicly
  delete full.id;
  return full;
});

// ----- admin -----
route('GET', '/api/admin/users', ({ user }) => {
  requireRole(user, 'admin');
  return plain(db.prepare(`SELECT u.id,u.role,u.name,u.email,u.company,u.country,u.status,u.created_at,v.origin,v.niche,v.cluster,v.certifications,v.capacity,v.verified
    FROM users u LEFT JOIN vendors v ON v.user_id=u.id ORDER BY u.id DESC`).all());
});
route('POST', '/api/admin/vendors/:id/verify', async ({ user, params, body }) => {
  requireRole(user, 'admin');
  if (!['pending', 'verified', 'suspended'].includes(body.status)) fail(400, 'Unknown status');
  const r = db.prepare('UPDATE vendors SET verified=? WHERE user_id=?').run(body.status, params.id);
  if (!r.changes) fail(404, 'Vendor not found');
  return { ok: true };
});


// ----- files & uploads -----
// Accepts JSON { kind, ref_id, label, name, data } where data is a base64 data: URL (max 5 MB).
const UPLOAD_TYPES = { 'image/jpeg': ['.jpg', (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff], 'image/png': ['.png', (b) => b.subarray(0, 4).toString('hex') === '89504e47'],
  'image/webp': ['.webp', (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP'], 'application/pdf': ['.pdf', (b) => b.subarray(0, 4).toString() === '%PDF'] };
const MAX_FILE = 5 * 1024 * 1024;
function orderFor(user, id) {
  const [w, a] = orderScope(user);
  return db.prepare(`SELECT o.* FROM orders o WHERE o.id=? AND ${w}`).get(id, ...a);
}
function canAttach(user, kind, refId) {
  if (kind === 'kyc') return user.role === 'vendor';
  if (kind === 'product') return user.role === 'vendor' && db.prepare('SELECT 1 FROM products WHERE id=? AND vendor_id=?').get(refId, user.id);
  if (kind === 'qc') return (user.role === 'vendor' || user.role === 'admin') && orderFor(user, refId);
  if (kind === 'shipping') return ['logistics', 'admin', 'vendor'].includes(user.role) && orderFor(user, refId);
  if (kind === 'rfq') return user.role === 'buyer' && db.prepare('SELECT 1 FROM rfqs WHERE id=? AND buyer_id=?').get(refId, user.id);
  return false;
}
function canRead(user, f) {
  if (f.kind === 'product') return true; // product photos are public catalogue content
  if (!user) return false;
  if (user.role === 'admin' || f.owner_id === user.id) return true;
  if (f.kind === 'qc' || f.kind === 'shipping') return !!orderFor(user, f.ref_id);
  if (f.kind === 'rfq') return user.role === 'vendor'; // reference images are shared with quoting vendors
  return false;
}
route('POST', '/api/uploads', async ({ user, body }) => {
  requireRole(user);
  const kind = body.kind, refId = body.ref_id == null || body.ref_id === '' ? null : Math.floor(num(body.ref_id));
  if (!['kyc', 'product', 'qc', 'shipping', 'rfq'].includes(kind)) fail(400, 'Unknown upload type');
  if (kind !== 'kyc' && !(refId > 0)) fail(400, 'Missing reference');
  if (!canAttach(user, kind, refId)) fail(403, 'You cannot attach files here');
  const m = /^data:([\w/+.-]+);base64,(.+)$/s.exec(String(body.data || ''));
  if (!m || !UPLOAD_TYPES[m[1]]) fail(415, 'Only JPG, PNG, WEBP images or PDF documents are accepted');
  if (kind === 'product' && m[1] === 'application/pdf') fail(415, 'Product photos must be JPG, PNG or WEBP');
  const buf = Buffer.from(m[2], 'base64');
  if (!buf.length || buf.length > MAX_FILE) fail(413, 'Each file must be under 5 MB');
  const [ext, sniff] = UPLOAD_TYPES[m[1]];
  if (!sniff(buf)) fail(415, 'File contents do not match its type');
  if (kind === 'product' && db.prepare("SELECT COUNT(*) n FROM files WHERE kind='product' AND ref_id=?").get(refId).n >= 6) fail(409, 'A product can have up to 6 photos');
  const stored = randomBytes(16).toString('hex') + ext;
  await mkdir(UPLOADS, { recursive: true });
  await writeFile(join(UPLOADS, stored), buf);
  const name = str(body.name, 120).replace(/[^\w .()-]/g, '_') || 'file' + ext;
  const r = db.prepare('INSERT INTO files (owner_id,kind,ref_id,label,name,mime,size,stored) VALUES (?,?,?,?,?,?,?,?)').run(user.id, kind, refId, str(body.label, 80), name, m[1], buf.length, stored);
  return { ok: true, id: Number(r.lastInsertRowid), url: `/files/${r.lastInsertRowid}` };
});
route('GET', '/api/files', ({ user, query }) => {
  requireRole(user);
  const kind = query.get('kind'), refId = Number(query.get('ref_id')) || null, owner = Number(query.get('owner')) || null;
  let rows;
  if (kind === 'kyc') {
    const who = user.role === 'admin' && owner ? owner : user.id;
    rows = db.prepare("SELECT id,kind,label,name,mime,size,created_at FROM files WHERE kind='kyc' AND owner_id=? ORDER BY id").all(who);
  } else if (kind === 'rfq') {
    rows = db.prepare("SELECT id,kind,label,name,mime,size,created_at FROM files WHERE kind='rfq' AND ref_id=? ORDER BY id").all(refId);
  } else if (kind === 'product') {
    rows = db.prepare("SELECT id,kind,label,name,mime,size,created_at FROM files WHERE kind='product' AND ref_id=? ORDER BY id").all(refId);
  } else fail(400, 'Unknown file list');
  return plain(rows).map((f) => ({ ...f, url: `/files/${f.id}` }));
});
route('DELETE', '/api/files/:id', async ({ user, params }) => {
  requireRole(user);
  const f = db.prepare('SELECT * FROM files WHERE id=?').get(params.id);
  if (!f || (f.owner_id !== user.id && user.role !== 'admin')) fail(404, 'File not found');
  db.prepare('DELETE FROM files WHERE id=?').run(f.id);
  await unlink(join(UPLOADS, f.stored)).catch(() => {});
  return { ok: true };
});
async function serveFile(req, res, id) {
  const f = db.prepare('SELECT * FROM files WHERE id=?').get(id);
  if (!f || !canRead(currentUser(req), f)) return send(res, 404, { error: 'File not found' });
  try {
    const data = await readFile(join(UPLOADS, f.stored));
    res.writeHead(200, { 'Content-Type': f.mime, 'Content-Length': data.length, 'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': `inline; filename="${f.name.replace(/"/g, '')}"`, 'Cache-Control': f.kind === 'product' ? 'public, max-age=86400' : 'private, no-store',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox" });
    res.end(data);
  } catch { send(res, 404, { error: 'File missing' }); }
}

// ----- email: verification, password reset, outbox -----
// sendMail is the single place to plug in an email provider (SMTP, SES, Postmark…). For now mail goes to the outbox table.
function sendMail(to, subject, body) {
  db.prepare('INSERT INTO outbox (to_email,subject,body) VALUES (?,?,?)').run(to, subject, body);
  console.log(`[mail] to ${to}: ${subject}`);
}
const baseUrl = (req) => PUBLIC_URL || `http://${req.headers.host}`;
const tokenHash = (t) => createHash('sha256').update(t).digest('hex');
function issueToken(userId, purpose, minutes) {
  db.prepare('UPDATE tokens SET used=1 WHERE user_id=? AND purpose=? AND used=0').run(userId, purpose);
  const t = randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO tokens (hash,user_id,purpose,expires) VALUES (?,?,?,?)').run(tokenHash(t), userId, purpose, Date.now() + minutes * 60e3);
  return t;
}
function useToken(t, purpose) {
  const row = db.prepare('SELECT * FROM tokens WHERE hash=? AND purpose=?').get(tokenHash(String(t || '')), purpose);
  if (!row || row.used || row.expires < Date.now()) fail(400, 'This link is invalid or has expired. Please request a new one.');
  db.prepare('UPDATE tokens SET used=1 WHERE hash=?').run(row.hash);
  return row.user_id;
}
function sendVerification(req, u) {
  const t = issueToken(u.id, 'verify', 60 * 48);
  sendMail(u.email, 'Confirm your Himbridge email address', `Hello ${u.name},\n\nPlease confirm your email address to activate all Himbridge features:\n${baseUrl(req)}/verify-email?token=${t}\n\nThis link is valid for 48 hours.\n\n— Himbridge Global Trade Portal`);
}
route('POST', '/api/email/verify', async ({ body }) => {
  const uid = useToken(body.token, 'verify');
  db.prepare('UPDATE users SET email_verified=1 WHERE id=?').run(uid);
  return { ok: true };
});
route('POST', '/api/email/resend', async ({ req, user }) => {
  requireRole(user);
  if (user.email_verified) return { ok: true, already: true };
  sendVerification(req, user);
  return { ok: true };
});
route('POST', '/api/password/forgot', async ({ req, body }) => {
  const email = str(body.email, 160).toLowerCase();
  const u = db.prepare("SELECT id,name,email FROM users WHERE email=? AND status='active'").get(email);
  if (u) {
    const t = issueToken(u.id, 'reset', 60);
    sendMail(u.email, 'Reset your Himbridge password', `Hello ${u.name},\n\nWe received a request to reset your password. Choose a new one here:\n${baseUrl(req)}/reset-password?token=${t}\n\nThis link is valid for 1 hour. If you did not ask for this, you can ignore this email.\n\n— Himbridge Global Trade Portal`);
  }
  return { ok: true }; // same answer whether or not the account exists
});
route('POST', '/api/password/reset', async ({ body }) => {
  const pw = String(body.password || '');
  if (pw.length < 8) fail(400, 'Password must be at least 8 characters');
  const uid = useToken(body.token, 'reset');
  db.prepare('UPDATE users SET pass_hash=?, email_verified=1 WHERE id=?').run(hashPassword(pw), uid);
  db.prepare('DELETE FROM sessions WHERE user_id=?').run(uid); // sign out everywhere
  return { ok: true };
});
route('POST', '/api/password/change', async ({ user, body }) => {
  requireRole(user);
  const row = db.prepare('SELECT pass_hash FROM users WHERE id=?').get(user.id);
  if (!checkPassword(String(body.current || ''), row.pass_hash)) fail(400, 'Current password is incorrect');
  if (String(body.password || '').length < 8) fail(400, 'New password must be at least 8 characters');
  db.prepare('UPDATE users SET pass_hash=? WHERE id=?').run(hashPassword(String(body.password)), user.id);
  return { ok: true };
});
route('GET', '/api/admin/outbox', ({ user }) => {
  requireRole(user, 'admin');
  return plain(db.prepare('SELECT * FROM outbox ORDER BY id DESC LIMIT 100').all());
});

// ----- payments -----
route('POST', '/api/payments/:id/submit', async ({ user, params, body }) => {
  requireRole(user, 'buyer');
  const p = db.prepare('SELECT p.*, o.buyer_id, o.status AS order_status FROM payments p JOIN orders o ON o.id=p.order_id WHERE p.id=?').get(params.id);
  if (!p || p.buyer_id !== user.id) fail(404, 'Payment not found');
  if (p.status === 'received') fail(409, 'This payment is already confirmed');
  if (p.stage === 'balance' && !['qc_passed', 'shipped', 'customs', 'delivered'].includes(p.order_status)) fail(409, 'The balance falls due after the QC inspection is passed');
  const ref = str(body.reference, 80);
  if (!ref) fail(400, 'Enter the bank / SWIFT / LC reference');
  db.prepare("UPDATE payments SET status='submitted', reference=?, updated_at=datetime('now') WHERE id=?").run(ref, p.id);
  return { ok: true };
});
route('POST', '/api/payments/:id/confirm', async ({ user, params }) => {
  requireRole(user, 'admin');
  const r = db.prepare("UPDATE payments SET status='received', updated_at=datetime('now') WHERE id=? AND status<>'received'").run(params.id);
  if (!r.changes) fail(404, 'Payment not found or already confirmed');
  return { ok: true };
});

// ----- printable trade documents -----
route('GET', '/api/orders/:id/document', ({ user, params }) => {
  requireRole(user);
  const [w, a] = orderScope(user);
  const o = db.prepare(`SELECT o.*, b.company AS buyer_company, b.name AS buyer_name, b.email AS buyer_email, b.country AS buyer_country, b.phone AS buyer_phone,
      v.company AS vendor_company, v.country AS vendor_country, vd.cluster AS vendor_cluster, vd.origin AS vendor_origin, q.lead_days, r.niche, r.details
    FROM orders o JOIN users b ON b.id=o.buyer_id JOIN users v ON v.id=o.vendor_id LEFT JOIN vendors vd ON vd.user_id=o.vendor_id
    LEFT JOIN quotes q ON q.id=o.quote_id LEFT JOIN rfqs r ON r.id=o.rfq_id WHERE o.id=? AND ${w}`).get(params.id, ...a);
  if (!o) fail(404, 'Order not found');
  const [full] = withOrderExtras([{ ...o }]);
  const niche = NICHES.find((n) => n.slug === o.niche);
  return { ...full, hs: niche?.hs?.split(',')[0]?.trim() || '' };
});

// Dev-only: collects UI strings for translation (see tools/i18n). Enabled only with I18N_COLLECT=1.
if (process.env.I18N_COLLECT === '1') route('POST', '/api/dev/collect', async ({ body }) => {
  const { readFileSync, writeFileSync, existsSync } = await import('node:fs');
  const f = join(ROOT, 'data', 'i18n-collected.json');
  const set = new Set(existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : []);
  (body.strings || []).forEach((x) => typeof x === 'string' && set.add(x));
  writeFileSync(f, JSON.stringify([...set].sort(), null, 1));
  return { total: set.size };
});

// ---------- server ----------
async function serveStatic(res, pathname) {
  let p = decodeURIComponent(pathname);
  if (p.endsWith('/')) p += 'index.html';
  if (!extname(p)) p += '.html';
  const file = normalize(join(PUBLIC, p));
  if (!file.startsWith(PUBLIC)) return send(res, 403, { error: 'Forbidden' });
  try {
    if (!(await stat(file)).isFile()) throw new Error();
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  } catch {
    const nf = await readFile(join(PUBLIC, '404.html')).catch(() => 'Not found');
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(nf);
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (!url.pathname.startsWith('/api/')) {
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });
      const fm = /^\/files\/(\d+)$/.exec(url.pathname);
      if (fm) return await serveFile(req, res, Number(fm[1]));
      return await serveStatic(res, url.pathname);
    }
    // Basic CSRF guard: state-changing API calls must come from this origin.
    if (req.method !== 'GET') {
      const origin = req.headers.origin;
      let host = null;
      try { host = origin ? new URL(origin).host : req.headers.host; } catch { /* malformed */ }
      if (host !== req.headers.host) fail(403, 'Cross-origin request blocked');
    }
    for (const r of routes) {
      if (r.method !== req.method) continue;
      const m = url.pathname.match(r.re);
      if (!m) continue;
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      const body = req.method === 'GET' ? {} : await readJson(req, url.pathname === '/api/uploads' ? 7.5e6 : 1e6);
      const result = await r.handler({ req, user: currentUser(req), params, body, query: url.searchParams });
      const headers = {};
      if (result && result._cookie !== undefined) { headers['Set-Cookie'] = result._cookie; delete result._cookie; }
      return send(res, 200, result, headers);
    }
    fail(404, 'Not found');
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.message });
    console.error(e);
    send(res, 500, { error: 'Server error' });
  }
}).listen(PORT, () => console.log(`Himbridge portal running at http://localhost:${PORT}`));
