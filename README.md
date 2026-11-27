# Himbridge Global Trade Portal

Made in India, delivered to the world. A B2B sourcing ecosystem for Indian manufacturers and overseas buyers of every
size: e-commerce brands and designers start a guided sourcing request (from 50 pieces, samples first), importers post
bulk RFQs, and Himbridge runs orders through milestone payments, QC, export documents and door-to-door logistics.
Manufacturers get an export readiness checklist and services to become export-ready.

See [docs/BLUEPRINT.md](docs/BLUEPRINT.md) for the business plan (categories, ecosystem, revenue, go-to-market).

## Tech stack

| Layer          | Choice                                                                    |
| -------------- | ------------------------------------------------------------------------- |
| Framework      | **Next.js 16** (App Router, React Server Components, Server Actions)      |
| Language       | **TypeScript** (strict)                                                   |
| Database       | **PostgreSQL** with **Drizzle ORM** and versioned SQL migrations          |
| Authentication | **Better Auth**: email + password, sessions, email verification, resets   |
| Validation     | **Zod** on every server action                                            |
| File storage   | Local disk or any **S3-compatible** bucket (AWS S3, Cloudflare R2, …)     |
| Email          | Any **SMTP** provider via Nodemailer (+ an outbox log in the admin panel) |
| Quality        | ESLint, Prettier, Vitest, GitHub Actions CI                               |
| Deployment     | **Docker** + docker-compose (app, Postgres, Caddy auto-HTTPS)             |

How the code is organised: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Going live: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) ·
Team workflow: [CONTRIBUTING.md](CONTRIBUTING.md)

## Run it locally

Requires **Node.js 22.13+** (24 recommended). No Docker needed for development.

```bash
npm install
cp .env.example .env          # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
npm run db:local              # terminal 1: starts a local PostgreSQL on port 5433 (leave running)
npm run db:migrate            # terminal 2: create the tables
npm run db:seed               #             load demo data
npm run dev                   #             http://localhost:3000
```

Already have PostgreSQL (or Docker)? Skip `db:local` and point `DATABASE_URL` in `.env` at your database.

**Demo logins** (password `Himbridge@123`, demo data only; never seed production):
admin@himbridge.trade · brand@himbridge.trade (e-commerce brand) · designer@himbridge.trade (interior designer) ·
buyer@himbridge.trade · omar@gulfliving.ae (importers) · vendor.in@himbridge.trade (handicrafts) ·
panipat@himbridge.trade (home textiles) · varanasi@himbridge.trade (silk) · assam@himbridge.trade (pending, new exporter) ·
spices@himbridge.trade (spices) · karnal@himbridge.trade (basmati) · kerala@himbridge.trade (pending vendor) · logistics@himbridge.trade

## Scripts

| Command                               | What it does                                                |
| ------------------------------------- | ----------------------------------------------------------- |
| `npm run dev`                         | Development server with hot reload                          |
| `npm run build` / `npm start`         | Production build / run it                                   |
| `npm run check`                       | Lint + type-check + tests (run before every push)           |
| `npm run format`                      | Format all files with Prettier                              |
| `npm run db:generate`                 | Create a migration after changing `src/server/db/schema.ts` |
| `npm run db:migrate`                  | Apply pending migrations                                    |
| `npm run db:seed`                     | Load demo data into an empty database                       |
| `npm run db:studio`                   | Browse the database in Drizzle Studio                       |
| `npm run i18n:extract` / `i18n:check` | List UI strings / report missing translations               |

## What the portal does

- **Public site:** home with live trade-network map, marketplace (four sectors of Indian-made products), category research,
  verified vendor directory, shipment tracking, trade tools (landed cost, HS codes, Incoterms, export checklist), about.
- **Source from India (small & mid buyers):** landing pages for brands, designers and importers (`/solutions/*`); a
  four-step sourcing request (product links, current / target / selling price, quantities, delivery terms, samples,
  private label); itemised offers from makers in the same sector, compared against the buyer's current and target
  price with savings and margin; samples; one-click production order; a message thread with the sourcing desk;
  suggested order size (trade / mid / volume) and shipping mode (courier / air / LCL / FCL).
- **Manufacturers:** export readiness checklist per sector (IEC, LUT, AD code, RCMC, FSSAI, FDA, certifications…) with
  where to apply, fees, timelines and renewal dates; a public Export Readiness Programme page; service requests
  (Export Start, Sector Ready, Certify, catalogue, shipment desk, training). Buyers can request samples consolidation,
  inspection, factory visits, design help and DDP shipping.
- **Accounts:** buyers (brand / designer / importer, which tailors their dashboard), vendors (with KYC upload and verification) and logistics partners; email verification;
  forgot / reset / change password. Admins are created by the team, never by sign-up.
- **Trade flow:** RFQ → quotes → accept → order with milestones (confirmed → in production → QC passed → shipped →
  customs → delivered). Each party can only move the milestones it owns.
- **Payments:** advance unlocks production (30%, or 50% for trade-size sourcing orders under ₹15 lakh), balance after
  QC unlocks dispatch. Buyers can reorder any past order in two clicks. Buyers submit a bank/LC
  reference; admins confirm receipt.
- **Documents:** printable proforma invoice, commercial invoice and packing list; uploads for KYC, product photos,
  RFQ references, QC reports and shipping documents (type-checked by file contents, permission-checked on download).
- **Languages:** English, Español, Français, Deutsch, العربية (right-to-left), rendered on the server.
