# Himbridge Global Trade Portal — Platform Blueprint

> Brand: **Himbridge Global**. *Him* = the Himalaya (strength, high standards); *bridge* = the trusted link between great makers and buyers worldwide. Public tagline: *Verified manufacturers · Delivered worldwide.*
>
> **Positioning rule (internal):** the public site never sells "India + China". Buyers see the Himbridge brand and two collections — **Crafted** (handmade, artisanal, natural materials) and **Engineered** (lighting, solar, appliances, electronics, modern furniture at scale). Country of origin stays in the data and appears only where the law needs it (commercial invoice, packing list, certificate of origin). This document is internal and may name the sourcing countries.
> Rename freely; the brand lives in one place (`public/assets/app.js` → `BRAND`) and the page headers.

---

## 1. The idea in one paragraph

Himbridge is a **360° cross-border trade ecosystem**. We onboard verified manufacturers in **India and China** across chosen niches, give international buyers a single, trusted portal to discover products, raise RFQs, compare quotes, place orders, and track goods door-to-door. Himbridge sits in the middle as the **trust + operations layer**: vendor verification, quality inspection, export documentation, freight booking, and payment milestones. Revenue comes from commissions, vendor subscriptions, and value-added services (QC, logistics, finance, private label).

**Why India + China together ("dual sourcing"):**

| Lever | India | China |
|---|---|---|
| Strength | Handmade, artisanal, natural materials, textiles, wellness, labour-intensive goods | Scale, electronics, hardware, components, speed, cost |
| Trade-agreement edge | FTAs/CEPAs with UAE, Australia, UK, EFTA; preferential access in several markets | Deep supply chains, low unit cost, fast samples |
| Risk hedge | "China + 1" demand from US/EU buyers diversifying away from single-country sourcing | Fallback capacity when India lead times or MOQs don't fit |
| Hybrid play | **China components → India finishing/assembly** (e.g. furniture hardware + Indian wood, LED drivers + Indian assembly) to optimise cost and rules-of-origin | |

> Tariffs and FTAs move fast. Every lane in the portal carries a "verify current duty" flag; the duty calculator uses editable rates, not hard-coded truth.

---

## 2. Niche research — where to start

Scored 1–5 on **Global demand**, **Margin**, **Ease of entry** (low MOQ, low compliance), and **Origin advantage**. Phase 1 picks are starred.

### India-origin niches

| # | Niche | Clusters | Best markets | Demand | Margin | Ease | Edge | Score |
|---|---|---|---|---|---|---|---|---|
| ★1 | Handicrafts & home décor (brass, wood carving, marble, blue pottery) | Moradabad, Jodhpur, Jaipur, Saharanpur, Agra | USA, UK, Germany, UAE, Australia | 5 | 5 | 4 | 5 | **19** |
| ★2 | Solid wood & cane furniture (sheesham, mango, acacia) | Jodhpur, Saharanpur, Kerala | USA, Netherlands, Germany, Australia | 5 | 4 | 3 | 5 | **17** |
| ★3 | Home textiles (bedding, towels, throws, cushion covers) | Panipat, Karur, Solapur | USA, UK, EU | 5 | 3 | 4 | 4 | **16** |
| ★4 | Rugs & carpets (hand-knotted, flat-weave, jute) | Bhadohi, Mirzapur, Panipat, Jaipur | USA, Germany, UK | 4 | 5 | 3 | 5 | **17** |
| 5 | Ayurvedic, herbal & wellness | Kerala, Uttarakhand, Gujarat | UAE, USA, UK | 4 | 5 | 2 | 5 | **16** |
| 6 | Leather goods & footwear | Kanpur, Agra, Chennai, Kolkata | EU, USA, UK | 4 | 4 | 3 | 4 | **15** |
| 7 | Fashion jewellery & gemstones | Jaipur, Surat, Mumbai | USA, UAE, Hong Kong | 4 | 5 | 3 | 4 | **16** |
| 8 | Spices & specialty foods | Kerala, Rajasthan, Gujarat | GCC, USA, EU | 5 | 3 | 2 | 5 | **15** |
| 9 | Sustainable/organic cotton apparel | Tiruppur, Ludhiana, Jaipur | EU, UK, USA | 4 | 3 | 3 | 4 | **14** |

### China-origin niches

| # | Niche | Clusters | Best markets | Demand | Margin | Ease | Edge | Score |
|---|---|---|---|---|---|---|---|---|
| ★10 | LED lighting & solar accessories | Zhongshan, Ningbo, Shenzhen | Africa, GCC, LATAM, India | 5 | 4 | 4 | 5 | **18** |
| ★11 | Electronics & mobile accessories / smart gadgets | Shenzhen, Dongguan | Global, Africa, GCC, LATAM | 5 | 3 | 4 | 5 | **17** |
| ★12 | Modern, office & outdoor furniture | Foshan, Anji | GCC, Africa, Australia | 4 | 4 | 3 | 5 | **16** |
| 13 | Packaging (eco mailers, boxes, paper bags) | Dongguan, Wenzhou | Global | 5 | 3 | 4 | 4 | **16** |
| 14 | Hardware, tools & building materials | Yongkang, Foshan | GCC, Africa, SE Asia | 4 | 3 | 3 | 5 | **15** |
| 15 | Home, kitchen & small appliances | Ningbo, Yiwu, Guangzhou | Global | 5 | 3 | 4 | 5 | **17** |
| 16 | Toys, festive & party décor | Yiwu, Shantou | Global, seasonal | 4 | 3 | 3 | 5 | **15** |

### Phase plan

- **Phase 1 (months 0–6):** Handicrafts & décor, wood furniture, rugs, home textiles (India) + LED/solar, home & kitchen (China). One "home & living" story = easy international branding.
- **Phase 2 (6–12):** Wellness/herbal, jewellery, leather (India) + electronics accessories, packaging (China).
- **Phase 3 (12+):** Hybrid "Made in India with global components", private-label Himbridge brands, B2B2C marketplaces (Amazon Global, Etsy wholesale, Faire).

### Target export markets (priority order)

1. **USA** — largest home & living importer; strong China+1 demand.
2. **UAE / GCC** — re-export hub to Africa & Middle East; India–UAE CEPA.
3. **UK** — India–UK FTA; handmade & sustainable sells.
4. **Germany / Netherlands** — EU gateway; furniture & rugs.
5. **Australia** — India–Australia ECTA; furniture & décor.
6. **Africa (Nigeria, Kenya, South Africa)** — China electronics/solar, price-led.

---

## 3. The ecosystem — who is on the platform

| Role | Who | What they do on Himbridge |
|---|---|---|
| **Buyer** | Importers, retailers, e-commerce brands, interior firms, distributors worldwide | Browse catalog, post RFQs, compare quotes, place orders, track shipments, download docs |
| **Vendor** | Manufacturers, artisan clusters, exporters in India & China | KYC/verification, list products, quote on RFQs, manage production, upload QC photos |
| **Logistics partner** | Freight forwarders, CHAs, inspection agencies | Get assigned shipments, update milestones (booking → loading → sailing → customs → delivered) |
| **Admin (Himbridge team)** | Operations, compliance, account managers | Approve vendors, moderate products, assign logistics, monitor orders, publish notices |

Future roles: **QC inspector**, **trade-finance partner**, **country agent/sourcing agent**.

---

## 4. Platform modules (360°)

1. **Public portal** — government-portal-style home: notices ticker, quick-access service tiles, niche directory, stats, corridor map, help desk.
2. **Identity & access** — registration per role, login, session security, role-based dashboards, vendor KYC states (`pending → verified → suspended`).
3. **Vendor onboarding** — company profile, origin (IN/CN), cluster, niche, certifications (IEC, GST, BSCI, ISO, FSC, CE), capacity, verification badge.
4. **Product catalog** — niche, origin, HS code, MOQ, FOB price range, lead time; filters by origin/niche.
5. **RFQ & quotation engine** — buyer posts RFQ → matching vendors quote → buyer accepts → order created.
6. **Order management** — milestones: `Confirmed → In production → QC passed → Shipped → Customs → Delivered`.
7. **Logistics & tracking** — shipment record per order (mode, incoterm, ports), milestone timeline, public tracking page.
8. **Trade tools** — landed-cost/duty calculator, HS code finder, Incoterms guide, export document checklist.
9. **Notices & announcements** — admin-published circulars (trade fairs, policy changes, new niches).
10. **Admin control room** — KPIs, vendor approval queue, user list, all orders, logistics assignment.

Later modules: escrow/payment milestones (LC, advance + balance), sample orders, trade-fair calendar, multilingual (EN/HI/ZH/AR), WhatsApp/email notifications, CRM sync, inspection booking, credit insurance (ECGC), analytics.

---

## 5. Revenue model

| Stream | How | Indicative |
|---|---|---|
| Order commission | % of order value on platform | 3–8% |
| Vendor subscription | Basic (free) / Gold / Platinum listing, priority RFQs | ₹/¥ monthly tiers |
| Verification & audit | Factory audit, badge | Per vendor fee |
| QC inspection | Pre-shipment inspection | Per inspection |
| Logistics margin | Freight & customs bookings | Per shipment |
| Private label | Himbridge-owned brands sourced from best vendors | Product margin |
| Trade finance referral | Invoice discounting / export credit partners | Referral fee |

---

## 6. "International hype" go-to-market

- **Brand story:** "Two manufacturing giants, one trusted desk." Video series from clusters (Moradabad brass, Jodhpur furniture, Foshan factories).
- **Trade fairs:** IHGF Delhi Fair, Canton Fair (Guangzhou), Ambiente (Frankfurt), High Point (USA), Index Dubai — exhibit as Himbridge pavilion.
- **LinkedIn + Instagram** buyer-facing content; cold outbound to importers via trade data (Panjiva/Volza-type data).
- **Marketplace presence:** Faire, Etsy Wholesale, Amazon Global Selling as demand testers.
- **Partnerships:** Export Promotion Councils (EPCH, CEPC), chambers of commerce, freight forwarders.
- **Founding Vendor programme:** first 100 vendors get free Gold tier + verified badge.

---

## 7. Tech architecture (this build)

- **Runtime:** Node.js 24, zero external dependencies.
- **Server:** `server.js` — `node:http` JSON API + static file server.
- **Database:** SQLite via built-in `node:sqlite` (`data/himbridge.db`), auto-seeded with demo data.
- **Auth:** scrypt-hashed passwords, random session tokens in HttpOnly cookies, role checks on every API route.
- **Frontend:** plain HTML/CSS/JS, white portal design, shared `assets/portal.css` + `assets/app.js`.
- **Uploads:** KYC documents, product photos, RFQ reference images, QC reports and shipping documents. JPG/PNG/WEBP/PDF only, 5 MB each, file signature checked, stored in `data/uploads/`, served with per-file permissions.
- **Email:** verification + password-reset links (one-time, hashed tokens). Mail goes to Admin → Email Outbox until a provider is connected in `sendMail()`.
- **Payments:** 30% advance (unlocks production) / 70% balance after QC (unlocks dispatch). Buyer submits bank/LC reference, admin confirms receipt. No card gateway yet.
- **Documents:** printable proforma invoice, commercial invoice and packing list (`/document?order=…&type=…`, Print → Save as PDF).
- **Languages:** English, Español, Français, Deutsch, العربية (RTL) for the shell and homepage hero.
- **Homepage map:** `tools/build-world-map.mjs` generates `public/assets/map/world-network.svg` from Natural Earth data (public domain).
- **Scale-up path:** PostgreSQL, object storage (S3/R2) for uploads, real email provider, payment gateway / escrow partner, full-page translations.

### Demo logins (password for all: `Himbridge@123`)

| Role | Email |
|---|---|
| Admin | admin@himbridge.trade |
| Buyer | buyer@himbridge.trade |
| Vendor (Crafted) | vendor.in@himbridge.trade |
| Vendor (Engineered) | vendor.cn@himbridge.trade |
| Logistics | logistics@himbridge.trade |

---

## 8. Roadmap

| Sprint | Deliverable |
|---|---|
| ✅ S1 (this build) | Portal, niches, catalog, login/registration, 4 role dashboards, RFQ → quote → order → shipment flow, tracking, trade tools |
| ✅ S2 | File uploads (KYC, product photos, QC & shipping docs), email verification, password reset, change password |
| ✅ S3 | Milestone payments (advance/balance), printable proforma / commercial invoice / packing list, animated world network map |
| S4 | Real email provider + payment/escrow gateway, full-page translations, WhatsApp notifications, mobile app |
| S5 | Analytics, CRM sync, trade-fair module, private-label store |
