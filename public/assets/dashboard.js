import { api, esc, usd, fmtNum, fmtDate, originChip, collectionName, getMe, getMeta, formData, showMsg, toast, qs, qsa, ph, timeline, progressBar, statusBadge, uploadAll, fileChip, dropzone, bindDropzones, ACCEPT_IMAGES } from '/assets/app.js';

const me = await getMe();
if (!me) location.replace('/login?next=' + encodeURIComponent('/dashboard' + location.hash));
const meta = await getMeta();
const { orderFlow: FLOW, statusOwner: OWNER } = meta;
const NICHE = Object.fromEntries(meta.niches.map((n) => [n.slug, n]));
const view = qs('#view');
const nicheName = (s) => NICHE[s]?.name || s;
const nicheOptions = (sel = '', origin = '') => meta.niches.filter((n) => !origin || n.origin === origin)
  .map((n) => `<option value="${n.slug}" ${n.slug === sel ? 'selected' : ''}>${esc(n.name)} · ${collectionName(n.origin)}</option>`).join('');
const ROLE_LABEL = { buyer: 'Buyer / Importer', vendor: 'Manufacturer / Vendor', logistics: 'Logistics Partner', admin: 'Himbridge Administrator' };
const ICON = { overview: '▦', 'post-rfq': '✚', rfqs: '☰', orders: '⛟', profile: '◉', products: '▤', inbox: '✉', shipments: '⛴', vendors: '✔', users: '☺', notices: '✎', outbox: '✆' };

// ---------- shared renderers ----------
const kpis = (items) => `<div class="kpis">${items.map(([l, n, c]) => `<div class="kpi" style="--c:${c || 'var(--navy)'}"><div class="n">${n}</div><div class="l">${l}</div></div>`).join('')}</div>`;
const empty = (t) => `<div class="empty">${t}</div>`;
const verifyBanner = () => (me.email_verified ? '' : `<div class="banner warn" id="verify-banner"><b>Please confirm your email address.</b> We sent a link to ${esc(me.email)}. <button class="btn sm ghost" id="resend-verify" style="margin-left:6px">Resend verification email</button></div>`);
const attachments = (json) => { const fs = JSON.parse(json || '[]'); return fs.length ? `<div class="files">${fs.map((f) => fileChip(f)).join('')}</div>` : ''; };
const PAY_LABEL = { advance: 'Advance', balance: 'Balance' };
const PAY_BADGE = { due: '<span class="badge bad">Due</span>', submitted: '<span class="badge warn">Awaiting confirmation</span>', received: '<span class="badge ok">Received</span>' };
const block = (title, body, tone = '', right = '') => `<div class="block" style="margin-bottom:16px"><div class="block-head ${tone}"><h3>${title}</h3>${right}</div><div class="block-body">${body}</div></div>`;

function ordersTable(orders) {
  if (!orders.length) return empty('No orders yet.');
  return `<div class="table-wrap"><table class="tbl"><thead><tr><th>Order</th><th>Item</th><th>Counterparty</th><th class="right">Value</th><th>Status</th></tr></thead><tbody>
    ${orders.map((o) => `<tr><td><b>${esc(o.code)}</b><br><span class="tiny muted">${fmtDate(o.created_at)}</span></td><td>${esc(o.title)}${progressBar(o, FLOW)}</td>
      <td class="small">${esc(me.role === 'buyer' ? o.vendor_company : o.buyer_company)}</td><td class="right nowrap">${usd(o.total, 0)}</td><td>${statusBadge(o.status, FLOW)}</td></tr>`).join('')}
  </tbody></table></div>`;
}

function orderCard(o, partners = []) {
  const idx = FLOW.findIndex((s) => s.key === o.status);
  const next = FLOW[idx + 1];
  let actions = '';
  if (next && (me.role === 'vendor' || me.role === 'logistics') && OWNER[next.key] === me.role) {
    actions = `<form class="ms-form" data-id="${o.id}" data-status="${next.key}">
      <label>Next milestone: ${esc(next.label)}</label><textarea name="note" placeholder="Note for buyer (e.g. vessel name, QC result)"></textarea>
      <button class="btn sm green" style="margin-top:8px">Mark as "${esc(next.label)}"</button></form>`;
  } else if (next && me.role !== 'admin' && me.role !== 'buyer') {
    actions = `<div class="small muted">Next milestone <b>${esc(next.label)}</b> is updated by the ${OWNER[next.key]} partner.</div>`;
  }
  if (me.role === 'buyer') actions = '';
  if (me.role === 'admin') {
    actions = `<form class="assign-form" data-id="${o.id}">
      <label>Logistics assignment</label>
      <select name="logistics_id"><option value="">Select partner</option>${partners.map((p) => `<option value="${p.id}" ${p.id === o.logistics_id ? 'selected' : ''}>${esc(p.company)}</option>`).join('')}</select>
      <div class="grid-form" style="margin-top:8px"><input name="mode" placeholder="Mode (e.g. Sea — 1 x 40HC)" value="${esc(o.mode || '')}"><select name="incoterm">${['EXW', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'].map((t) => `<option ${t === o.incoterm ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <div class="grid-form" style="margin-top:8px"><input name="origin_port" placeholder="Origin port" value="${esc(o.origin_port || '')}"><input name="dest_port" placeholder="Destination port" value="${esc(o.dest_port || '')}"></div>
      <button class="btn sm" style="margin-top:8px">Save logistics</button></form>
      <form class="override-form" data-id="${o.id}" style="margin-top:14px"><label>Override status (admin)</label>
      <div style="display:flex;gap:8px"><select name="status">${FLOW.slice(1).map((s) => `<option value="${s.key}" ${s.key === o.status ? 'selected' : ''}>${esc(s.label)}</option>`).join('')}</select><button class="btn sm ghost">Set</button></div></form>`;
  }
  return `<div class="rfq-card"><header><div><b>${esc(o.code)}</b> — ${esc(o.title)}<div class="tiny muted">Created ${fmtDate(o.created_at)}</div></div>${statusBadge(o.status, FLOW)}</header>
    <div class="body">
      <div class="kv" style="margin-bottom:12px"><span>Buyer <b>${esc(o.buyer_company)}</b></span><span>Vendor <b>${esc(o.vendor_company)}</b> ${originChip(o.vendor_origin)}</span>
        <span>Qty <b>${fmtNum(o.quantity)} ${esc(o.unit || '')}</b></span><span>Unit <b>${usd(o.unit_price)}</b></span><span>Total <b>${usd(o.total)}</b></span>
        <span>Incoterm <b>${esc(o.incoterm)}</b></span><span>Route <b>${esc(o.origin_port || '—')} → ${esc(o.dest_port || o.destination || '—')}</b></span><span>Logistics <b>${esc(o.logistics_company || 'Not assigned')}</b></span></div>
      <div class="grid g2">${timeline(o, FLOW)}<div>${payments(o)}${documents(o)}${actions}</div></div>
    </div></div>`;
}

function payments(o) {
  if (!o.payments?.length) return '';
  const qcDone = FLOW.findIndex((s) => s.key === o.status) >= FLOW.findIndex((s) => s.key === 'qc_passed');
  return `<label>Payment schedule</label><ul class="pay">${o.payments.map((p) => `<li class="${p.status}">
      <span><b>${PAY_LABEL[p.stage]} ${p.pct}%</b> · ${usd(p.amount)}<br><span class="tiny muted">${p.stage === 'advance' ? 'Releases production' : 'After QC, releases dispatch'}${p.reference ? ' · Ref ' + esc(p.reference) : ''}</span></span>${PAY_BADGE[p.status]}
      ${me.role === 'buyer' && p.status !== 'received' && (p.stage === 'advance' || qcDone) ? `<form class="pay-form" data-id="${p.id}"><input name="reference" placeholder="Bank / SWIFT / LC reference" value="${esc(p.reference || '')}" aria-label="Payment reference"><button class="btn sm saffron">${p.status === 'submitted' ? 'Update' : 'I have paid'}</button></form>` : ''}
      ${me.role === 'admin' && p.status !== 'received' ? `<form class="pay-confirm" data-id="${p.id}"><button class="btn sm green">Confirm funds received</button></form>` : ''}</li>`).join('')}</ul>`;
}

function documents(o) {
  const at = (k) => FLOW.findIndex((s) => s.key === o.status) >= FLOW.findIndex((s) => s.key === k);
  const gen = [['proforma', 'Proforma invoice', true], ['commercial', 'Commercial invoice', at('qc_passed')], ['packing', 'Packing list', at('qc_passed')]];
  const up = o.documents || [];
  const canQc = me.role === 'vendor' || me.role === 'admin', canShip = ['logistics', 'admin', 'vendor'].includes(me.role);
  return `<label>Trade documents</label>
    <div class="doc-links">${gen.map(([t, l, ok]) => ok ? `<a class="btn sm ghost" href="/document?order=${o.id}&type=${t}" target="_blank" rel="noopener">📄 ${l}</a>` : `<span class="btn sm ghost" aria-disabled="true" style="opacity:.5;cursor:not-allowed" title="Available after QC">📄 ${l}</span>`).join('')}</div>
    ${up.length ? `<div class="files">${up.map((f) => fileChip(f, { del: me.role === 'admin' })).join('')}</div>` : '<div class="tiny muted" style="margin-bottom:10px">No QC reports or shipping documents uploaded yet.</div>'}
    ${canQc || canShip ? `<form class="doc-form" data-id="${o.id}" style="margin-bottom:12px"><div class="grid-form" style="margin-bottom:6px">
      <select name="kind" aria-label="Document type">${canQc ? '<option value="qc|QC inspection report">QC inspection report</option><option value="qc|Production / packing photo">Production / packing photo</option>' : ''}${canShip ? '<option value="shipping|Bill of lading / AWB">Bill of lading / AWB</option><option value="shipping|Certificate of origin">Certificate of origin</option><option value="shipping|Shipping bill / export declaration">Shipping bill / export declaration</option><option value="shipping|Insurance certificate">Insurance certificate</option><option value="shipping|Other document">Other document</option>' : ''}</select></div>
      ${dropzone('files')}<button class="btn sm" style="margin-top:6px">Upload</button></form>` : ''}`;
}

function bindOrderForms(reload) {
  qsa('.ms-form').forEach((f) => (f.onsubmit = async (e) => {
    e.preventDefault();
    try { await api(`/api/orders/${f.dataset.id}/status`, { body: { status: f.dataset.status, note: f.note.value } }); toast('Milestone updated'); reload(); }
    catch (err) { toast(err.message, true); }
  }));
  qsa('.assign-form').forEach((f) => (f.onsubmit = async (e) => {
    e.preventDefault();
    try { await api(`/api/orders/${f.dataset.id}/assign`, { body: formData(f) }); toast('Logistics saved'); reload(); }
    catch (err) { toast(err.message, true); }
  }));
  qsa('.override-form').forEach((f) => (f.onsubmit = async (e) => {
    e.preventDefault();
    try { await api(`/api/orders/${f.dataset.id}/status`, { body: { status: f.status.value, note: 'Status set by Himbridge operations.' } }); toast('Status updated'); reload(); }
    catch (err) { toast(err.message, true); }
  }));
}

// ---------- buyer ----------
const buyer = {
  async overview() {
    const [rfqs, orders] = await Promise.all([api('/api/rfqs'), api('/api/orders')]);
    const quotes = rfqs.reduce((n, r) => n + r.quotes.length, 0);
    const active = orders.filter((o) => o.status !== 'delivered').length;
    return verifyBanner() + (new URLSearchParams(location.search).get('welcome') ? '<div class="banner ok">Welcome to Himbridge! Your buyer account is active. Post your first buying requirement to receive quotations.</div>' : '')
      + kpis([['Open RFQs', rfqs.filter((r) => r.status === 'open').length, 'var(--saffron)'], ['Quotes received', quotes], ['Active orders', active, 'var(--green)'], ['Total order value', usd(orders.reduce((s, o) => s + o.total, 0), 0), 'var(--red)']])
      + `<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap"><a class="btn saffron" href="#post-rfq">Post new RFQ</a><a class="btn ghost" href="/marketplace">Browse marketplace</a><a class="btn ghost" href="#orders">Track orders</a></div>`
      + block('Recent orders', ordersTable(orders.slice(0, 5)));
  },
  'post-rfq'(params) {
    return block('Post a buying requirement (RFQ)', `<form id="rfq-form" novalidate><div class="form-msg" id="msg"></div>
      <div class="grid-form">
        <div class="field full"><label>Requirement title <span class="req">*</span></label><input name="title" value="${esc(params.get('title') || '')}" placeholder="e.g. Hand-knotted wool rugs for autumn collection"></div>
        <div class="field"><label>Niche <span class="req">*</span></label><select name="niche"><option value="">Select</option>${nicheOptions(params.get('niche') || '')}</select></div>
        <div class="field"><label>Collection</label><select name="origin_pref"><option value="ANY">Any collection (best quote)</option><option value="IN">Crafted only — handmade &amp; natural</option><option value="CN">Engineered only — tech &amp; scale</option></select></div>
        <div class="field"><label>Quantity <span class="req">*</span></label><input name="quantity" type="number" min="1"></div>
        <div class="field"><label>Unit</label><select name="unit"><option>pcs</option><option>sets</option><option>pairs</option><option>kg</option><option>sq m</option><option>containers</option></select></div>
        <div class="field"><label>Destination port / city <span class="req">*</span></label><input name="destination" placeholder="e.g. Los Angeles, USA" value="${esc(me.country || '')}"></div>
        <div class="field"><label>Target unit price (USD)</label><input name="target_price" type="number" step="0.01" min="0"></div>
        <div class="field full"><label>Specifications</label><textarea name="details" placeholder="Material, size, finish, packaging, certifications, delivery window…"></textarea></div>
        <div class="field full"><label>Reference images / tech-pack <span class="tiny muted">(optional, shared with quoting vendors)</span></label>${dropzone('refs')}</div>
      </div><button class="btn saffron">Submit RFQ</button></form>`, 'saffron');
  },
  async rfqs() {
    const rfqs = await api('/api/rfqs');
    if (!rfqs.length) return empty('You have not posted any RFQs yet. <a href="#post-rfq">Post your first RFQ →</a>');
    return rfqs.map((r) => `<div class="rfq-card"><header><div><b>RFQ #${r.id} — ${esc(r.title)}</b><div class="tiny muted">${esc(nicheName(r.niche))} · posted ${fmtDate(r.created_at)}</div></div>
      <span class="badge ${r.status === 'open' ? 'warn' : 'ok'}">${r.status}</span></header><div class="body">
      <div class="kv" style="margin-bottom:10px"><span>Qty <b>${fmtNum(r.quantity)} ${esc(r.unit)}</b></span><span>Destination <b>${esc(r.destination)}</b></span><span>Target <b>${r.target_price ? usd(r.target_price) : '—'}</b></span><span>Collection ${originChip(r.origin_pref)}</span></div>
      ${r.details ? `<p class="small">${esc(r.details)}</p>` : ''}${attachments(r.attachments)}
      ${r.quotes.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Vendor</th><th>Collection</th><th class="right">Unit price</th><th class="right">Order value</th><th>Lead time</th><th>Note</th><th></th></tr></thead><tbody>
        ${r.quotes.map((q) => `<tr><td><b>${esc(q.vendor_company)}</b><br><span class="tiny muted">${esc(q.certifications || '')}</span></td><td>${originChip(q.origin)}</td>
          <td class="right">${usd(q.unit_price)}</td><td class="right">${usd(q.unit_price * r.quantity, 0)}</td><td>${q.lead_days} days</td><td class="small">${esc(q.note || '')}</td>
          <td>${r.status === 'open' ? `<button class="btn sm green" data-accept="${q.id}">Accept</button>` : `<span class="badge ${q.status === 'accepted' ? 'ok' : 'grey'}">${q.status}</span>`}</td></tr>`).join('')}
        </tbody></table></div>` : '<div class="small muted">Awaiting quotations from matched vendors.</div>'}
    </div></div>`).join('');
  },
  async orders() {
    const orders = await api('/api/orders');
    return orders.length ? orders.map((o) => orderCard(o)).join('') : empty('No orders yet. Accept a quotation to create an order.');
  },
};

// ---------- vendor ----------
const vendor = {
  async overview() {
    const [products, rfqs, orders] = await Promise.all([api('/api/my/products'), api('/api/rfqs'), api('/api/orders')]);
    const v = me.vendor;
    const banner = v.verified === 'verified' ? '<div class="banner ok">✔ Your company is <b>verified</b>. You can quote on buyer RFQs.</div>'
      : v.verified === 'pending' ? '<div class="banner warn"><b>Verification pending.</b> The Himbridge compliance team will review your KYC within 7 working days. You can add products now; they go live and you can quote once verified.</div>'
        : '<div class="banner warn"><b>Account suspended.</b> Contact the help desk.</div>';
    return verifyBanner() + banner + kpis([['Listed products', products.length, 'var(--saffron)'], ['Matching open RFQs', rfqs.filter((r) => !r.my_quote).length], ['Quotes submitted', rfqs.filter((r) => r.my_quote).length, 'var(--green)'], ['Active orders', orders.filter((o) => o.status !== 'delivered').length, 'var(--red)']])
      + `<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap"><a class="btn saffron" href="#inbox">Open RFQ inbox</a><a class="btn ghost" href="#products">Add product</a></div>`
      + block('Recent orders', ordersTable(orders.slice(0, 5)));
  },
  async products() {
    const ps = await api('/api/my/products');
    const form = `<details class="inline" ${ps.length ? '' : 'open'}><summary>+ Add a new product</summary><form id="prod-form" novalidate><div class="form-msg" id="msg"></div>
      <div class="grid-form">
        <div class="field full"><label>Product title <span class="req">*</span></label><input name="title"></div>
        <div class="field"><label>Niche <span class="req">*</span></label><select name="niche">${nicheOptions(me.vendor.niche, me.vendor.origin)}</select></div>
        <div class="field"><label>HS code</label><input name="hs_code" placeholder="e.g. 9403.60"></div>
        <div class="field"><label>MOQ <span class="req">*</span></label><input name="moq" type="number" min="1"></div>
        <div class="field"><label>Unit</label><select name="unit"><option>pcs</option><option>sets</option><option>pairs</option><option>kg</option><option>sq m</option></select></div>
        <div class="field"><label>FOB price min (USD) <span class="req">*</span></label><input name="price_min" type="number" step="0.01"></div>
        <div class="field"><label>FOB price max (USD) <span class="req">*</span></label><input name="price_max" type="number" step="0.01"></div>
        <div class="field"><label>Lead time (days) <span class="req">*</span></label><input name="lead_days" type="number" min="1"></div>
        <div class="field"><label>Material</label><input name="material"></div>
        <div class="field full"><label>Description</label><textarea name="description"></textarea></div>
        <div class="field full"><label>Product photos <span class="tiny muted">(up to 6 · first photo is the cover)</span></label>${dropzone('photos', { accept: ACCEPT_IMAGES, hint: 'JPG, PNG or WEBP · max 5 MB each · 800 × 600 or larger' })}</div>
      </div><button class="btn saffron">Save product</button></form></details>`;
    const table = ps.length ? `<div class="table-wrap"><table class="tbl"><thead><tr><th></th><th>Product</th><th>Niche</th><th>MOQ</th><th class="right">FOB range</th><th>Lead</th><th></th></tr></thead><tbody>
      ${ps.map((p) => `<tr><td style="width:80px">${p.image ? `<img class="thumb" src="${p.image}" alt="">` : ph('', '', 'niche-img')}<label class="tiny" style="display:block;margin-top:4px;cursor:pointer;color:var(--blue)">+ Photos<input type="file" accept="${ACCEPT_IMAGES}" multiple data-prodimg="${p.id}" hidden></label></td><td><b>${esc(p.title)}</b><br><span class="tiny muted">HS ${esc(p.hs_code || '—')} · ${esc(p.material || '')}</span></td><td class="small">${esc(nicheName(p.niche))}</td>
        <td>${fmtNum(p.moq)} ${esc(p.unit)}</td><td class="right nowrap">${usd(p.price_min)} – ${usd(p.price_max)}</td><td>${p.lead_days} d</td><td><button class="btn sm danger" data-del="${p.id}">Remove</button></td></tr>`).join('')}
      </tbody></table></div>` : '';
    return block(`My products (${ps.length})`, form + (table ? '<div style="margin-top:16px">' + table + '</div>' : ''), 'saffron');
  },
  async inbox() {
    const rfqs = await api('/api/rfqs');
    const locked = me.vendor.verified !== 'verified';
    const head = locked ? '<div class="banner warn">Quoting unlocks once your company is verified. You can preview matching RFQs below.</div>'
      : `<div class="banner info"><span>Showing open RFQs for your collection:</span> <b>${collectionName(me.vendor.origin)}</b> · <span>Matches in your category are listed first:</span> <b>${esc(nicheName(me.vendor.niche))}</b></div>`;
    if (!rfqs.length) return head + empty('No open RFQs right now. New buyer requirements appear here automatically.');
    return head + rfqs.map((r) => `<div class="rfq-card"><header><div><b>RFQ #${r.id} — ${esc(r.title)}</b><div class="tiny muted">${esc(nicheName(r.niche))} · ${esc(r.buyer_country)} buyer · posted ${fmtDate(r.created_at)}</div></div>
      ${r.niche === me.vendor.niche ? '<span class="badge ok">Your niche</span>' : '<span class="badge grey">Other niche</span>'}</header><div class="body">
      <div class="kv" style="margin-bottom:8px"><span>Qty <b>${fmtNum(r.quantity)} ${esc(r.unit)}</b></span><span>Destination <b>${esc(r.destination)}</b></span><span>Target <b>${r.target_price ? usd(r.target_price) : 'Open'}</b></span><span>Quotes so far <b>${r.quote_count}</b></span></div>
      ${r.details ? `<p class="small">${esc(r.details)}</p>` : ''}${attachments(r.attachments)}
      ${r.my_quote ? `<div class="banner ok" style="margin:0 0 6px">Your quote: <b>${usd(r.my_quote.unit_price)}</b> / ${esc(r.unit)}, ${r.my_quote.lead_days} days lead time.</div>` : ''}
      ${locked ? '' : `<details class="inline"><summary>${r.my_quote ? 'Revise quotation' : 'Submit quotation'}</summary><form class="quote-form" data-id="${r.id}">
        <div class="grid-form three"><div class="field"><label>Unit price (USD, FOB)</label><input name="unit_price" type="number" step="0.01" value="${r.my_quote?.unit_price ?? ''}"></div>
        <div class="field"><label>Lead time (days)</label><input name="lead_days" type="number" value="${r.my_quote?.lead_days ?? ''}"></div>
        <div class="field"><label>Order value</label><input disabled class="ov" value="—"></div>
        <div class="field full"><label>Note to buyer</label><textarea name="note">${esc(r.my_quote?.note || '')}</textarea></div></div>
        <button class="btn sm green">Send quotation</button></form></details>`}
    </div></div>`).join('');
  },
  async orders() {
    const orders = await api('/api/orders');
    return orders.length ? orders.map((o) => orderCard(o)).join('') : empty('No orders yet. Win RFQs to receive orders.');
  },
};

// ---------- logistics ----------
const logistics = {
  async overview() {
    const orders = await api('/api/orders');
    return verifyBanner() + kpis([['Assigned shipments', orders.length, 'var(--saffron)'], ['Awaiting pickup', orders.filter((o) => ['confirmed', 'in_production', 'qc_passed'].includes(o.status)).length], ['In transit', orders.filter((o) => ['shipped', 'customs'].includes(o.status)).length, 'var(--blue)'], ['Delivered', orders.filter((o) => o.status === 'delivered').length, 'var(--green)']])
      + block('Assigned shipments', ordersTable(orders));
  },
  async shipments() {
    const orders = await api('/api/orders');
    return orders.length ? orders.map((o) => orderCard(o)).join('') : empty('No shipments assigned yet. Himbridge operations will assign confirmed orders to you.');
  },
};

// ---------- admin ----------
const admin = {
  async overview() {
    const [s, users, orders] = await Promise.all([api('/api/stats'), api('/api/admin/users'), api('/api/orders')]);
    const pending = users.filter((u) => u.role === 'vendor' && u.verified === 'pending').length;
    return (pending ? `<div class="banner warn"><b>${pending} vendor${pending > 1 ? 's' : ''}</b> awaiting verification. <a href="#vendors">Review now →</a></div>` : '')
      + kpis([['Verified vendors', s.vendors, 'var(--saffron)'], ['Buyers', s.buyers], ['Open RFQs', s.openRfqs, 'var(--red)'], ['Trade value', usd(s.tradeValue, 0), 'var(--green)']])
      + kpis([['Crafted vendors', s.vendorsIN, 'var(--saffron)'], ['Engineered vendors', s.vendorsCN, '#1d4f91'], ['Live SKUs', s.products], ['Payments to confirm', orders.flatMap((o) => o.payments || []).filter((p) => p.status === 'submitted').length, 'var(--red)']])
      + block('Latest orders', ordersTable(orders.slice(0, 6)));
  },
  async vendors() {
    const vs = (await api('/api/admin/users')).filter((u) => u.role === 'vendor').sort((a, b) => (a.verified === 'pending' ? -1 : 0) - (b.verified === 'pending' ? -1 : 0));
    const kyc = await Promise.all(vs.map((v) => api(`/api/files?kind=kyc&owner=${v.id}`).catch(() => [])));
    return block('Vendor verification queue', `<div class="table-wrap"><table class="tbl"><thead><tr><th>Company</th><th>Collection</th><th>Category</th><th>Certifications</th><th>KYC documents</th><th>Status</th><th>Action</th></tr></thead><tbody>
      ${vs.map((v) => `<tr><td><b>${esc(v.company)}</b><br><span class="tiny muted">${esc(v.name)} · ${esc(v.email)}</span></td><td>${originChip(v.origin)}<br><span class="tiny muted">${esc(v.cluster || '')}</span></td>
        <td class="small">${esc(nicheName(v.niche))}<br><span class="tiny muted">${esc(v.capacity || '')}</span></td><td class="small">${esc(v.certifications || '—')}</td><td>${kyc[vs.indexOf(v)].length ? `<div class="files" style="margin:0">${kyc[vs.indexOf(v)].map((f) => fileChip(f)).join('')}</div>` : '<span class="tiny muted">None uploaded</span>'}</td>
        <td><span class="badge ${v.verified === 'verified' ? 'ok' : v.verified === 'pending' ? 'warn' : 'bad'}">${v.verified}</span></td>
        <td class="nowrap">${v.verified !== 'verified' ? `<button class="btn sm green" data-verify="${v.id}" data-s="verified">Verify</button>` : ''}
          ${v.verified !== 'suspended' ? `<button class="btn sm danger" data-verify="${v.id}" data-s="suspended">Suspend</button>` : `<button class="btn sm ghost" data-verify="${v.id}" data-s="pending">Re-review</button>`}</td></tr>`).join('')}
      </tbody></table></div>`, 'saffron');
  },
  async users() {
    const us = await api('/api/admin/users');
    return block(`All users (${us.length})`, `<div class="table-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Role</th><th>Company</th><th>Country</th><th>Joined</th></tr></thead><tbody>
      ${us.map((u) => `<tr><td><b>${esc(u.name)}</b><br><span class="tiny muted">${esc(u.email)}</span></td><td><span class="badge info">${u.role}</span></td><td>${esc(u.company || '')}</td><td>${esc(u.country || '')}</td><td class="small">${fmtDate(u.created_at)}</td></tr>`).join('')}
      </tbody></table></div>`);
  },
  async rfqs() {
    const rs = await api('/api/rfqs');
    return block('All RFQs', `<div class="table-wrap"><table class="tbl"><thead><tr><th>#</th><th>Requirement</th><th>Buyer</th><th>Qty</th><th>Collection</th><th>Quotes</th><th>Status</th></tr></thead><tbody>
      ${rs.map((r) => `<tr><td>${r.id}</td><td><b>${esc(r.title)}</b><br><span class="tiny muted">${esc(nicheName(r.niche))} → ${esc(r.destination)}</span></td><td class="small">${esc(r.buyer_company)}</td>
        <td>${fmtNum(r.quantity)} ${esc(r.unit)}</td><td>${originChip(r.origin_pref)}</td><td>${r.quote_count}${r.quotes.length ? `<br><span class="tiny muted">best ${usd(r.quotes[0].unit_price)}</span>` : ''}</td>
        <td><span class="badge ${r.status === 'open' ? 'warn' : 'ok'}">${r.status}</span></td></tr>`).join('')}
      </tbody></table></div>`);
  },
  async orders() {
    const [orders, partners] = await Promise.all([api('/api/orders'), api('/api/logistics-partners')]);
    return orders.length ? orders.map((o) => orderCard(o, partners)).join('') : empty('No orders yet.');
  },
  async outbox() {
    const mails = await api('/api/admin/outbox');
    return '<div class="banner info"><b>Development mailbox.</b> No email provider is connected yet, so verification and password-reset emails are kept here (and printed in the server log). Connect SMTP / SES / Postmark in <code>sendMail()</code> in server/server.js to deliver them for real.</div>'
      + block(`Email outbox (${mails.length})`, mails.length ? mails.map((m) => `<div class="mail"><header><span><b>${esc(m.subject)}</b></span><span class="tiny muted">To ${esc(m.to_email)} · ${fmtDate(m.created_at)}</span></header><pre>${esc(m.body).replace(/(https?:\/\/\S+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')}</pre></div>`).join('') : empty('No emails sent yet.'));
  },
  async notices() {
    const ns = await api('/api/notices');
    return block('Publish a notice / circular', `<form id="notice-form"><div class="form-msg" id="msg"></div>
      <div class="grid-form"><div class="field full"><label>Title <span class="req">*</span></label><input name="title"></div>
      <div class="field"><label>Tag</label><select name="tag"><option>Notice</option><option>Update</option><option>Advisory</option><option>Trade Fair</option><option>Programme</option></select></div>
      <div class="field full"><label>Details</label><textarea name="body"></textarea></div></div><button class="btn saffron">Publish</button></form>`, 'saffron')
      + block('Published notices', `<ul class="notices">${ns.map((n) => `<li><span class="badge info">${esc(n.tag)}</span><span><div class="t">${esc(n.title)}</div><div class="tiny muted">${fmtDate(n.created_at)}</div></span></li>`).join('')}</ul>`);
  },
};

async function profile() {
  const v = me.vendor;
  const kyc = v ? await api('/api/files?kind=kyc') : [];
  const details = block('My profile', `<div class="grid g2"><div><table class="tbl">
    ${[['Name', me.name], ['Email', me.email + (me.email_verified ? ' ✔' : ' (unconfirmed)')], ['Company', me.company], ['Country', me.country], ['Phone', me.phone || '—'], ['Account type', ROLE_LABEL[me.role]]].map(([k, x]) => `<tr><td class="muted">${k}</td><td><b>${esc(x)}</b></td></tr>`).join('')}
    ${v ? [['Factory country', v.origin === 'IN' ? 'India' : 'China'], ['Collection', collectionName(v.origin)], ['Cluster', v.cluster || '—'], ['Primary category', nicheName(v.niche)], ['Certifications', v.certifications || '—'], ['Capacity', v.capacity || '—'], ['Verification', v.verified]].map(([k, x]) => `<tr><td class="muted">${k}</td><td><b>${esc(x)}</b></td></tr>`).join('') : ''}
  </table></div><div>${ph(v ? 'Company logo' : 'Profile photo', '400 × 400').replace('class="ph ', 'style="height:200px" class="ph ')}
    ${v ? `<div style="margin-top:10px">${ph('Factory photo', '1200 × 600').replace('class="ph ', 'style="height:120px" class="ph ')}</div>` : ''}</div></div>`);
  const kycBlock = v ? block('KYC & certification documents', `<p class="small muted" style="margin-top:0">Upload your export registration, tax registration, business licence and certificates (ISO, BSCI, FSC, CE…). Only you and the Himbridge compliance team can see these files.</p>
    ${kyc.length ? `<div class="files">${kyc.map((f) => fileChip(f, { del: true })).join('')}</div>` : '<div class="banner warn">No documents uploaded yet — verification cannot start without them.</div>'}
    <form id="kyc-form"><div class="grid-form" style="margin-bottom:8px"><select name="label" aria-label="Document type"><option>Export registration</option><option>Tax registration</option><option>Business licence</option><option>Factory audit report</option><option>Quality certificate</option><option>Other</option></select></div>
    ${dropzone('files')}<button class="btn sm saffron" style="margin-top:8px">Upload documents</button></form>`, 'saffron') : '';
  const pw = block('Change password', `<form id="pw-form" novalidate><div class="form-msg" id="pw-msg"></div><div class="grid-form three">
    <div class="field"><label>Current password</label><input name="current" type="password" autocomplete="current-password"></div>
    <div class="field"><label>New password</label><input name="password" type="password" autocomplete="new-password" minlength="8"></div>
    <div class="field"><label>Confirm new password</label><input name="confirm" type="password" autocomplete="new-password"></div></div>
    <button class="btn sm">Update password</button></form>`);
  return verifyBanner() + details + kycBlock + pw;
}

const MENUS = {
  buyer: [['overview', 'Overview', buyer.overview], ['post-rfq', 'Post RFQ', buyer['post-rfq']], ['rfqs', 'My RFQs & Quotes', buyer.rfqs], ['orders', 'Orders & Tracking', buyer.orders], ['profile', 'Profile', profile]],
  vendor: [['overview', 'Overview', vendor.overview], ['inbox', 'RFQ Inbox', vendor.inbox], ['products', 'My Products', vendor.products], ['orders', 'Orders & Production', vendor.orders], ['profile', 'Company Profile', profile]],
  logistics: [['overview', 'Overview', logistics.overview], ['shipments', 'Shipments', logistics.shipments], ['profile', 'Profile', profile]],
  admin: [['overview', 'Control Room', admin.overview], ['vendors', 'Vendor Verification', admin.vendors], ['orders', 'Orders & Payments', admin.orders], ['rfqs', 'RFQs', admin.rfqs], ['users', 'Users', admin.users], ['notices', 'Notices', admin.notices], ['outbox', 'Email Outbox', admin.outbox], ['profile', 'Profile', profile]],
};
const menu = MENUS[me.role];

qs('#dash-title').textContent = `${ROLE_LABEL[me.role]} Dashboard`;
qs('#dash-sub').innerHTML = `<span>Welcome,</span> ${esc(me.name)} — ${esc(me.company)}`;
qs('#side-user').innerHTML = `${ph('', '', 'logo-ph')}<b style="margin-top:8px">${esc(me.company)}</b><span class="tiny muted">${esc(me.name)} · ${ROLE_LABEL[me.role]}</span>
  ${me.vendor ? `<div style="margin-top:6px">${originChip(me.vendor.origin)} <span class="badge ${me.vendor.verified === 'verified' ? 'ok' : 'warn'}">${me.vendor.verified}</span></div>` : ''}`;
qs('#side-nav').innerHTML = menu.map(([id, label]) => `<a href="#${id}" data-id="${id}"><span aria-hidden="true">${ICON[id] || '•'}</span>${label}</a>`).join('')
  + '<a href="#" id="side-logout"><span aria-hidden="true">⏻</span>Logout</a>';
qs('#side-logout').onclick = async (e) => { e.preventDefault(); await api('/api/logout', { method: 'POST', body: {} }); location.href = '/'; };

async function render() {
  const [id, qstr] = location.hash.slice(1).split('?');
  const params = new URLSearchParams(qstr || '');
  let entry = menu.find((m) => m[0] === id);
  if (!entry && id === 'post-rfq') {
    view.innerHTML = `<div class="banner warn">Only <b>buyer</b> accounts can post RFQs. You are signed in as ${ROLE_LABEL[me.role]}.</div>`;
    return;
  }
  entry ||= menu[0];
  qsa('#side-nav a').forEach((a) => a.classList.toggle('active', a.dataset.id === entry[0]));
  view.innerHTML = '<div class="empty">Loading…</div>';
  try { view.innerHTML = await entry[2](params); }
  catch (err) { view.innerHTML = `<div class="banner warn">${esc(err.message)}</div>`; return; }
  bindView();
}

function bindView() {
  bindOrderForms(render);
  bindDropzones(view);
  const rv = qs('#resend-verify');
  if (rv) rv.onclick = async () => { try { await api('/api/email/resend', { method: 'POST', body: {} }); toast('Verification email sent'); } catch (err) { toast(err.message, true); } };
  qsa('.pay-form').forEach((f) => (f.onsubmit = async (e) => {
    e.preventDefault();
    try { await api(`/api/payments/${f.dataset.id}/submit`, { body: formData(f) }); toast('Payment reference sent — Himbridge will confirm receipt'); render(); }
    catch (err) { toast(err.message, true); }
  }));
  qsa('.pay-confirm').forEach((f) => (f.onsubmit = async (e) => {
    e.preventDefault();
    if (!confirm('Confirm these funds have been received in the Himbridge account?')) return;
    try { await api(`/api/payments/${f.dataset.id}/confirm`, { method: 'POST', body: {} }); toast('Payment confirmed'); render(); }
    catch (err) { toast(err.message, true); }
  }));
  qsa('.doc-form').forEach((f) => (f.onsubmit = async (e) => {
    e.preventDefault();
    const files = [...f.files.files];
    if (!files.length) return toast('Choose at least one file', true);
    const [kind, label] = f.kind.value.split('|');
    try { await uploadAll(files, { kind, ref_id: f.dataset.id, label }); toast('Uploaded'); render(); }
    catch (err) { toast(err.message, true); }
  }));
  const kf = qs('#kyc-form');
  if (kf) kf.onsubmit = async (e) => {
    e.preventDefault();
    const files = [...kf.files.files];
    if (!files.length) return toast('Choose at least one file', true);
    try { await uploadAll(files, { kind: 'kyc', label: kf.label.value }); toast('Documents uploaded'); render(); }
    catch (err) { toast(err.message, true); }
  };
  qsa('[data-delfile]').forEach((b) => (b.onclick = async () => {
    if (!confirm('Remove this file?')) return;
    try { await api(`/api/files/${b.dataset.delfile}`, { method: 'DELETE' }); toast('File removed'); render(); }
    catch (err) { toast(err.message, true); }
  }));
  qsa('[data-prodimg]').forEach((inp) => (inp.onchange = async () => {
    try { await uploadAll([...inp.files], { kind: 'product', ref_id: inp.dataset.prodimg }); toast('Photos added'); render(); }
    catch (err) { toast(err.message, true); }
  }));
  const pwf = qs('#pw-form');
  if (pwf) pwf.onsubmit = async (e) => {
    e.preventDefault();
    const d = formData(pwf);
    if (d.password !== d.confirm) return showMsg(qs('#pw-msg'), 'The new passwords do not match.');
    try { await api('/api/password/change', { body: d }); showMsg(qs('#pw-msg'), 'Password updated.', true); pwf.reset(); }
    catch (err) { showMsg(qs('#pw-msg'), err.message); }
  };
  const rfqForm = qs('#rfq-form');
  if (rfqForm) rfqForm.onsubmit = async (e) => {
    e.preventDefault();
    const refs = [...rfqForm.refs.files];
    try {
      const r = await api('/api/rfqs', { body: formData(rfqForm) });
      if (refs.length) await uploadAll(refs, { kind: 'rfq', ref_id: r.id });
      toast('RFQ posted — matched vendors have been notified'); location.hash = 'rfqs';
    }
    catch (err) { showMsg(qs('#msg'), err.message); }
  };
  qsa('[data-accept]').forEach((b) => (b.onclick = async () => {
    if (!confirm('Accept this quotation? An order will be created and other quotes will be declined.')) return;
    try { const r = await api(`/api/quotes/${b.dataset.accept}/accept`, { method: 'POST', body: {} }); toast(`Order ${r.code} created`); location.hash = 'orders'; }
    catch (err) { toast(err.message, true); }
  }));
  const prodForm = qs('#prod-form');
  if (prodForm) prodForm.onsubmit = async (e) => {
    e.preventDefault();
    const photos = [...prodForm.photos.files].slice(0, 6);
    try {
      const r = await api('/api/products', { body: formData(prodForm) });
      if (photos.length) await uploadAll(photos, { kind: 'product', ref_id: r.id });
      toast('Product saved'); render();
    }
    catch (err) { showMsg(qs('#msg'), err.message); }
  };
  qsa('[data-del]').forEach((b) => (b.onclick = async () => {
    if (!confirm('Remove this product from your catalog?')) return;
    try { await api(`/api/products/${b.dataset.del}`, { method: 'DELETE' }); toast('Product removed'); render(); }
    catch (err) { toast(err.message, true); }
  }));
  qsa('.quote-form').forEach((f) => {
    const card = f.closest('.rfq-card');
    const qty = Number(card.querySelector('.kv b').textContent.replace(/[^\d]/g, ''));
    const upd = () => { f.querySelector('.ov').value = f.unit_price.value ? usd(f.unit_price.value * qty, 0) : '—'; };
    f.unit_price.oninput = upd; upd();
    f.onsubmit = async (e) => {
      e.preventDefault();
      try { await api(`/api/rfqs/${f.dataset.id}/quotes`, { body: formData(f) }); toast('Quotation sent to buyer'); render(); }
      catch (err) { toast(err.message, true); }
    };
  });
  qsa('[data-verify]').forEach((b) => (b.onclick = async () => {
    try { await api(`/api/admin/vendors/${b.dataset.verify}/verify`, { body: { status: b.dataset.s } }); toast(`Vendor ${b.dataset.s}`); render(); }
    catch (err) { toast(err.message, true); }
  }));
  const nf = qs('#notice-form');
  if (nf) nf.onsubmit = async (e) => {
    e.preventDefault();
    try { await api('/api/notices', { body: formData(nf) }); toast('Notice published'); render(); }
    catch (err) { showMsg(qs('#msg'), err.message); }
  };
}

window.addEventListener('hashchange', render);
render();
