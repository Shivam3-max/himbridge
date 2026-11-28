# Himbridge Global Trade Portal

Verified sourcing → export worldwide. See **BLUEPRINT.md** for the full brainstorm (categories, ecosystem, revenue, go-to-market, roadmap) and the brand positioning rule.

## Run

Requires Node.js 22.13+ (uses built-in `node:sqlite`, no npm install needed).

```bash
npm run dev        # http://localhost:3870
npm run reset-db   # stop the server first; wipes local data + uploads
```

No demo data is seeded. On first start the server creates one admin account from `HIMBRIDGE_ADMIN_EMAIL` and
`HIMBRIDGE_ADMIN_PASSWORD` (8+ characters). Vendors, buyers and logistics partners register themselves; the admin verifies
vendors, and verified vendors list products.

Environment variables: `PORT`, `PUBLIC_URL` (e.g. `https://himbridge.com`, used in email links and to mark the session
cookie Secure), `HIMBRIDGE_DATA_DIR` (database + uploads; in production keep it outside the deployed app folder so
redeploys never wipe data), `HIMBRIDGE_ADMIN_EMAIL`, `HIMBRIDGE_ADMIN_PASSWORD`.

## What works

- Public portal: home with live trade-network map, marketplace (Crafted / Engineered collections), categories & research, vendor directory, shipment tracking, trade tools, about.
- Accounts: registration for buyers, vendors (with KYC upload) and logistics partners; login; email verification; forgot / reset / change password.
- RFQ → quotation → order → milestones → delivery, with role rules for who updates what.
- Payments: 30% advance unlocks production, 70% balance after QC unlocks dispatch. Buyers submit a bank / LC reference, admin confirms receipt.
- Uploads: KYC documents, product photos (shown in the marketplace), RFQ reference images, QC reports, shipping documents.
- Printable proforma invoice, commercial invoice and packing list (Print → Save as PDF).
- Languages: English, Español, Français, Deutsch, العربية (right-to-left) across every page, dashboard, form, message and printable document.

## Email (development mailbox)

No email provider is connected yet. Verification and password-reset emails are saved to the database and shown in
**Admin → Email Outbox** (and printed in the server log). To send real email, implement `sendMail()` in `server/server.js`
with SMTP / SES / Postmark and set `PUBLIC_URL` to the live site address.

## Translations

Every page is translated in the browser from `public/assets/i18n/<lang>.json`. Each file maps the English UI text to
its translation; numbers, prices and dates inside a sentence are written as `{#}`. Company names, product titles and
anything users type are not translated. Missing strings simply stay in English.

When you add or change UI text:
1. Run the server with `I18N_COLLECT=1 npm start`, open the site, and in the browser console run
   `const { crawl } = await import('/assets/dev/collect.js'); await crawl(['/', '/marketplace', '/dashboard#overview'])`
   (log in as each role for dashboard pages). This writes `data/i18n-collected.json`.
2. `node tools/i18n/extract.mjs` — builds `tools/i18n/strings.en.json` (adds error/toast messages, drops database content).
3. Add the new strings to each `public/assets/i18n/*.json`, then check with `node tools/i18n/check.mjs es fr de ar`.

## Structure

- `server/server.js` — HTTP server, JSON API, auth/sessions, uploads, email, payments, role checks
- `server/db.js` — SQLite schema + demo seed
- `server/data.js` — category research data, order milestone flow
- `public/` — portal pages (white, block-based portal design)
- `public/assets/portal.css` — design system · `app.js` — shared shell, i18n, upload helpers · `dashboard.js` — role dashboards
- `public/assets/brand/` — logo files · `public/assets/map/` — generated world map
- `tools/build-world-map.mjs` — regenerates the map from Natural Earth `countries-110m.json` (world-atlas npm package):
  `npm run build-map -- path/to/countries-110m.json`

## Banners & images

- Homepage hero slider (4 slides), page banners (marketplace, categories, vendors, tracking, tools, about), the login card and the About photos use real photos in `public/assets/img/` (Unsplash License — see `public/assets/img/CREDITS.md`).
- Banners are built in HTML/CSS (photo + navy gradient + text), so the text stays sharp, responsive and translated. To change a page banner, edit its `pageBanner('…', { img, kicker, line, pos })` call; for the slider, edit the slides in `public/index.html`.
- To swap a photo, replace the file with one of the same name (hero 2000 × 900, page banner 1800 × 640) or point `img` at a new file.
- Still placeholders: category thumbnails, vendor logos and company/profile photos (these should be the vendors' own images).
