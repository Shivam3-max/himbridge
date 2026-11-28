# Himbridge Global Trade Portal — Platform Blueprint

> Brand: **Himbridge Global**. _Him_ = the Himalaya (strength, high standards); _bridge_ = the trusted link between great makers and buyers worldwide. Public tagline: _Verified manufacturers · Delivered worldwide._
>
> **Positioning rule:** Himbridge onboards **Indian manufacturers only** and sells their products worldwide. "Made in India" is a selling point, not something to hide. Products are grouped into four sectors — **Home & Living**, **Food & Agri**, **Fashion & Textiles** and **Wellness & Natural** (`src/domain/sectors.ts`).
> Rename freely; the brand lives in one place (`public/assets/app.js` → `BRAND`) and the page headers.

---

## 1. The idea in one paragraph

Himbridge is a **360° cross-border trade ecosystem for Indian manufacturers**. We onboard verified makers — artisan clusters, MSMEs and established exporters — across India's evergreen export niches, and give international buyers a single, trusted portal to discover products, raise RFQs, compare quotes, place orders, and track goods door-to-door. Himbridge sits in the middle as the **trust + operations layer**: vendor verification, export-readiness support for first-time exporters, quality inspection, export documentation, freight booking, and payment milestones. Revenue comes from commissions, vendor subscriptions, and value-added services (export readiness, QC, logistics, finance, private label).

**Why India only:**

| Lever                | Why it matters                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Strength             | Handmade, artisanal and natural-material goods, textiles, spices, rice, tea, wellness — categories India leads in |
| Trade-agreement edge | India–UK CETA (in force July 2026), India–UAE CEPA, India–Australia ECTA, India–EU FTA concluded                  |
| Supply-base gap      | Thousands of capable MSMEs have never exported; Himbridge's readiness service turns them into exporters           |
| Brand clarity        | One origin, one story — "Made in India, delivered to the world"                                                   |

> Tariffs and FTAs move fast. Every lane in the portal carries a "verify current duty" flag; the duty calculator uses editable rates, not hard-coded truth.

---

## 2. Niche research — where to start

Scored 1–5 on **Global demand**, **Margin**, **Ease of entry** (low MOQ, low compliance), and **Origin advantage**. Phase 1 picks are starred.

### Niches by sector (all India-origin)

| #   | Niche                              | Sector             | Clusters                                        | Best markets                         | Demand | Margin | Ease | Edge | Score  |
| --- | ---------------------------------- | ------------------ | ----------------------------------------------- | ------------------------------------ | ------ | ------ | ---- | ---- | ------ |
| ★1  | Handicrafts & home décor           | Home & Living      | Moradabad, Jodhpur, Jaipur, Saharanpur, Agra    | USA, UK, Germany, UAE, Australia     | 5      | 5      | 4    | 5    | **19** |
| ★2  | Solid wood & cane furniture        | Home & Living      | Jodhpur, Saharanpur, Kerala                     | USA, Netherlands, Germany, Australia | 5      | 4      | 3    | 5    | **17** |
| ★3  | Rugs & carpets                     | Home & Living      | Bhadohi, Mirzapur, Panipat, Jaipur              | USA, Germany, UK                     | 4      | 5      | 3    | 5    | **17** |
| ★4  | Home textiles                      | Home & Living      | Panipat, Karur, Solapur                         | USA, UK, EU                          | 5      | 3      | 4    | 4    | **16** |
| ★5  | Spices & masalas                   | Food & Agri        | Kerala, Rajasthan, Gujarat                      | GCC, USA, EU                         | 5      | 3      | 2    | 5    | **15** |
| ★6  | Sustainable cotton apparel         | Fashion & Textiles | Tiruppur, Ludhiana, Jaipur                      | EU, UK, USA                          | 4      | 3      | 3    | 4    | **14** |
| 7   | Basmati rice & grains              | Food & Agri        | Karnal, Amritsar, Kaithal, Dehradun             | Saudi Arabia, UAE, Iraq, USA, UK     | 5      | 3      | 3    | 5    | **16** |
| 8   | Tea & coffee                       | Food & Agri        | Assam, Darjeeling, Nilgiris, Coorg, Chikmagalur | UAE, Russia, UK, Germany, Italy, USA | 4      | 4      | 3    | 5    | **16** |
| 9   | Cashew, makhana & superfoods       | Food & Agri        | Kollam, Mangaluru, Darbhanga, Madhubani         | UAE, USA, Netherlands, UK, Japan     | 4      | 4      | 3    | 5    | **16** |
| 10  | Handloom, silk & sarees            | Fashion & Textiles | Varanasi, Kanchipuram, Bhagalpur, Mysuru        | USA, UAE, UK, Singapore, Canada      | 4      | 5      | 3    | 5    | **17** |
| 11  | Fashion jewellery & gemstones      | Fashion & Textiles | Jaipur, Surat, Mumbai                           | USA, UAE, Hong Kong                  | 4      | 5      | 3    | 4    | **16** |
| 12  | Leather goods & footwear           | Fashion & Textiles | Kanpur, Agra, Chennai, Kolkata                  | EU, USA, UK                          | 4      | 4      | 3    | 4    | **15** |
| 13  | Ayurvedic, herbal & wellness       | Wellness & Natural | Kerala, Uttarakhand, Gujarat                    | UAE, USA, UK                         | 4      | 5      | 2    | 5    | **16** |
| 14  | Essential oils & natural cosmetics | Wellness & Natural | Kannauj, Kerala, Uttarakhand, Tamil Nadu        | USA, France, UK, UAE                 | 4      | 5      | 3    | 4    | **16** |
| 15  | Incense, candles & festive décor   | Wellness & Natural | Bengaluru, Mysuru, Gaya, Moradabad              | USA, UAE, UK, Nigeria, Mexico        | 4      | 4      | 4    | 5    | **17** |
| 16  | Natural stone, marble & granite    | Home & Living      | Makrana, Kishangarh, Udaipur, Karimnagar        | USA, UK, GCC, Italy, Australia       | 4      | 4      | 2    | 5    | **15** |

The live list is `src/domain/niches.ts`; this table is a snapshot.

### Phase plan

- **Phase 1 (months 0–6):** Handicrafts & décor, wood furniture, rugs, home textiles, spices, cotton apparel.
- **Phase 2 (6–12):** Basmati, tea & coffee, cashew & makhana, handloom silk, jewellery, leather, wellness.
- **Phase 3 (12+):** Stone, essential oils, incense & festive; private-label Himbridge brands; B2B2C channels (Amazon Global, Etsy wholesale, Faire).

### Target export markets (priority order)

1. **USA** — largest home & living importer; watch the changing tariff on Indian goods.
2. **UAE / GCC** — re-export hub to Africa & Middle East; India–UAE CEPA.
3. **UK** — India–UK CETA in force since July 2026 (zero duty on most lines); handmade & sustainable sells.
4. **Germany / Netherlands** — EU gateway; furniture & rugs.
5. **Australia** — India–Australia ECTA; furniture & décor.
6. **Africa (Nigeria, Kenya, South Africa)** — rice, spices, apparel, incense; large Indian diaspora.

---

## 3. The ecosystem — who is on the platform

| Role                       | Who                                                                             | What they do on Himbridge                                                                     |
| -------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Buyer**                  | Importers, retailers, e-commerce brands, interior firms, distributors worldwide | Browse catalog, post RFQs, compare quotes, place orders, track shipments, download docs       |
| **Vendor**                 | Indian manufacturers, artisan clusters and exporters                            | KYC/verification, list products, quote on RFQs, manage production, upload QC photos           |
| **Logistics partner**      | Freight forwarders, CHAs, inspection agencies                                   | Get assigned shipments, update milestones (booking → loading → sailing → customs → delivered) |
| **Admin (Himbridge team)** | Operations, compliance, account managers                                        | Approve vendors, moderate products, assign logistics, monitor orders, publish notices         |

Future roles: **QC inspector**, **trade-finance partner**, **country agent/sourcing agent**.

---

## 4. Platform modules (360°)

1. **Public portal** — government-portal-style home: notices ticker, quick-access service tiles, niche directory, stats, corridor map, help desk.
2. **Identity & access** — registration per role, login, session security, role-based dashboards, vendor KYC states (`pending → verified → suspended`).
3. **Vendor onboarding** — company profile, cluster, niche (which sets the sector), certifications (IEC, GST, RCMC, FSSAI, BSCI, ISO, FSC), capacity, verification badge.
4. **Product catalog** — niche, origin, HS code, MOQ, FOB price range, lead time; filters by origin/niche.
5. **RFQ & quotation engine** — buyer posts RFQ → matching vendors quote → buyer accepts → order created.
6. **Order management** — milestones: `Confirmed → In production → QC passed → Shipped → Customs → Delivered`.
7. **Logistics & tracking** — shipment record per order (mode, incoterm, ports), milestone timeline, public tracking page.
8. **Trade tools** — landed-cost/duty calculator, HS code finder, Incoterms guide, export document checklist.
9. **Notices & announcements** — admin-published circulars (trade fairs, policy changes, new niches).
10. **Admin control room** — KPIs, vendor approval queue, user list, all orders, logistics assignment.
11. **Sourcing desk (small & mid buyers)** — landing pages per buyer type (brands, designers, importers); a four-step
    sourcing request with product links, current / target / selling prices, quantities, delivery terms, samples and
    private label; itemised offers from makers in the same sector, compared on saving vs. today and margin; samples;
    one-click production order (50/50 payments for trade-size orders); message thread with the Himbridge desk.
12. **Export readiness** — per-sector checklist for manufacturers (IEC, LUT, AD code, ICEGATE, RCMC, eCoO, FSSAI,
    commodity boards, US FDA, phytosanitary, ISPM-15, lab tests, certifications) with where to apply, fee, time,
    validity, renewal date and a readiness score; public programme page; service requests for vendors and buyers.
13. **Buyer types** — brand / designer / importer chosen at sign-up; tailors the dashboard (next steps, quick starts).

Later modules: escrow/payment milestones (LC, advance + balance), sample orders, trade-fair calendar, multilingual (EN/HI/ZH/AR), WhatsApp/email notifications, CRM sync, inspection booking, credit insurance (ECGC), analytics.

---

## 5. Revenue model

| Stream                 | How                                                   | Indicative        |
| ---------------------- | ----------------------------------------------------- | ----------------- |
| Order commission       | % of order value on platform                          | 3–8%              |
| Vendor subscription    | Basic (free) / Gold / Platinum listing, priority RFQs | ₹/¥ monthly tiers |
| Verification & audit   | Factory audit, badge                                  | Per vendor fee    |
| QC inspection          | Pre-shipment inspection                               | Per inspection    |
| Logistics margin       | Freight & customs bookings                            | Per shipment      |
| Private label          | Himbridge-owned brands sourced from best vendors      | Product margin    |
| Trade finance referral | Invoice discounting / export credit partners          | Referral fee      |

---

## 6. "International hype" go-to-market

- **Brand story:** "Made in India. Delivered to the world." Video series from clusters (Moradabad brass, Jodhpur furniture, Bhadohi rugs, Kerala spices, Varanasi silk).
- **Trade fairs:** IHGF Delhi Fair, Bharat Tex, India International Spice Conference, Gulfood (Dubai), Ambiente (Frankfurt), High Point (USA), Index Dubai — exhibit as Himbridge pavilion.
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

| Role                 | Email                     |
| -------------------- | ------------------------- |
| Admin                | admin@himbridge.trade     |
| Buyer (importer)     | buyer@himbridge.trade     |
| Buyer (brand)        | brand@himbridge.trade     |
| Buyer (designer)     | designer@himbridge.trade  |
| Vendor (Textiles)    | panipat@himbridge.trade   |
| Vendor (Handicrafts) | vendor.in@himbridge.trade |
| Vendor (Spices)      | spices@himbridge.trade    |
| Logistics            | logistics@himbridge.trade |

---

## 8. Roadmap

| Sprint             | Deliverable                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| ✅ S1 (this build) | Portal, niches, catalog, login/registration, 4 role dashboards, RFQ → quote → order → shipment flow, tracking, trade tools |
| ✅ S2              | File uploads (KYC, product photos, QC & shipping docs), email verification, password reset, change password                |
| ✅ S3              | Milestone payments (advance/balance), printable proforma / commercial invoice / packing list, animated world network map   |
| ✅ S4              | Sourcing desk for brands & designers, offer comparison, samples, export readiness checklist, services, dropdown navigation |
| S5                 | Real email provider + payment/escrow gateway, full-page translations, WhatsApp notifications, mobile app                   |
| S6                 | Analytics, CRM sync, trade-fair module, private-label store                                                                |
