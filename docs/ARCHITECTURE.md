# Architecture

## Folder layout

```
src/
  app/                    Routes (Next.js App Router). One folder = one URL.
    (site)/               Pages that share the portal header and footer
      dashboard/          Signed-in area; layout.tsx guards it and draws the sidebar
        admin/            Staff-only pages (layout.tsx redirects non-admins)
    documents/            Printable trade documents (no site chrome)
    files/[id]/           Permission-checked file downloads
    api/auth/[...all]/    Better Auth endpoints (sign in/out, reset, verify)
    api/health/           Health check for the host / load balancer
  actions/                Server Actions — the only way the browser changes data
  components/             React components
    ui/                   Design-system primitives (Block, Badge, Timeline, forms, toast…)
    layout/ dashboard/ catalog/ home/ tools/   Feature components
  domain/                 Pure business rules & reference data (no I/O) — unit tested
  server/                 Server-only code
    db/schema.ts          Database tables (Drizzle). Change it, then `npm run db:generate`
    services/             Data access + permissions, one file per area
    auth/                 Better Auth config and getCurrentUser / requireUser helpers
    storage/              Upload storage drivers (local disk, S3)
    mail.ts               Email sending + outbox log
  i18n/                   Translation runtime and dictionaries
  lib/                    Small shared helpers (formatting, validation schemas, hooks)
  config/                 Brand constants and validated environment variables
drizzle/                  Generated SQL migrations (commit them)
scripts/                  Local DB, migrate, seed, i18n tools, world-map generator
tests/                    Vitest unit tests
deploy/                   Caddy (HTTPS) config used by docker-compose
```

## How a request flows

**Reading data** — pages are React Server Components. They call a service directly:

```
app/(site)/dashboard/orders/page.tsx → requirePageUser() → services/orders.listOrders(user) → Drizzle → Postgres
```

**Changing data** — forms call a Server Action, which is a thin wrapper:

```
<form onSubmit>  →  actions/trade.ts updateMilestone()
                      runAction(): requireUser() → zod validation → services/orders.updateMilestone() → revalidatePath()
                      returns { ok, message } or { ok: false, error } (already translated)
```

Rules of thumb:

1. **Business rules live in `src/domain`** (pure functions, unit tested) — e.g. who may move an order to which
   milestone, the 30/70 payment split, landed-cost maths.
2. **Permissions live in `src/server/services`.** Every service takes the current user and checks it. Never trust the
   browser: hidden buttons are a convenience, not security.
3. **Actions stay thin:** authenticate → validate with a schema from `src/lib/validation.ts` → call a service.
4. **Throw `AppError` for expected failures** (`src/server/errors.ts`). `runAction` turns it into a friendly message;
   anything else is logged and the user sees a generic error.
5. Files that must never reach the browser start with `import 'server-only'`.

## Database

- Schema: `src/server/db/schema.ts`. Money columns are `numeric(14,2)` read back as numbers.
- After editing the schema: `npm run db:generate` creates a new SQL file in `drizzle/`; review and commit it.
  `npm run db:migrate` applies it (production runs this automatically before the app starts).
- Auth tables (`user`, `session`, `account`, `verification`) belong to Better Auth; extra user fields (role, company,
  country, phone, status) are declared both in the schema and in `server/auth/auth.ts` → `user.additionalFields`.

## Authentication

- Better Auth (`src/server/auth/auth.ts`), sessions stored in Postgres, 7-day cookies (`hbg.*`), secure cookies in
  production, rate limits on sign-in and reset endpoints.
- Sign-up over raw HTTP is disabled; `actions/auth.ts → register` is the only way to create an account, so the account
  type is always validated and vendors always get a profile. Admin accounts are created by an existing admin/DB.
- Disabled users (`user.status = 'disabled'`) cannot start a session.

## Translations

The English text is the key (gettext style): `t('Export Marketplace')`. Numbers, prices and dates inside a sentence are
matched as `{#}`, so ``t(`${n} products found`)`` uses the template `"{#} products found"`.

- Server components: `const { t } = await getI18n()` · Client components: `const t = useT()`.
- The language is stored in the `hbg-lang` cookie and pages render translated on the server (Arabic switches to RTL).
- After changing UI text: `npm run i18n:extract`, add translations to `src/i18n/messages/*.json`, then
  `npm run i18n:check`.
- Never pass user content (company names, product titles) through `t()`.

## Styling

`src/app/globals.css` is the portal design system (blocks, badges, tables, timeline, banners…) carried over from the
first version. Prefer its classes and the primitives in `components/ui/primitives.tsx`; add new styles there with a
short comment.
