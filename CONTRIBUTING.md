# Working on the portal

## Everyday workflow

1. Branch from `main`: `git checkout -b feature/short-description`
2. Make the change (see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for where things go).
3. `npm run check` — lint, type-check and tests must pass. `npm run format` fixes formatting.
4. Open a pull request. CI runs the same checks plus migrations, seed and a production build.
5. Get a review, then merge. `main` should always be deployable.

## Common tasks

**Add a page** — create `src/app/(site)/<path>/page.tsx` (public) or under `dashboard/` (signed in). Export
`metadata = { title }`. Read data by calling a service; translate fixed text with `t()`.

**Add a form that changes data**

1. Add a zod schema in `src/lib/validation.ts`.
2. Add the logic + permission check in a service in `src/server/services/`.
3. Add a thin server action in `src/actions/` using `runAction(...)`.
4. In a client component: `const f = useFormAction(myAction, { onSuccess: () => router.refresh() })` and
   `<form onSubmit={f.onSubmit}>…<SubmitButton pending={f.pending}>Save</SubmitButton></form>`.

**Change the database**

1. Edit `src/server/db/schema.ts`.
2. `npm run db:generate` → review the new file in `drizzle/` → commit it with your change.
3. `npm run db:migrate` locally. Production applies it on deploy.
   Never edit a migration that has already been deployed — add a new one.

**Add or change UI text** — wrap it in `t('…')`, then `npm run i18n:extract` and add translations for
`es`, `fr`, `de`, `ar` in `src/i18n/messages/`. `npm run i18n:check` shows what is missing.

**Business rule changes** (milestones, payment split, permissions) — change `src/domain/` and add/adjust a test in
`tests/`.

## Conventions

- TypeScript strict; no `any` without a comment explaining why.
- Server-only modules start with `import 'server-only'`; secrets are read only through `src/config/env.ts`.
- Expected failures: `throw new AppError('Message shown to the user', status)`.
- Commit messages: imperative mood, short subject (`Add vendor logo upload`).
- Never commit `.env` files, database dumps or uploads.
