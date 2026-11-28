# Going live

The portal is a standard Node.js app with a PostgreSQL database, so it runs on any professional host. Two common routes:

| Route                                              | Good for                          | You manage              |
| -------------------------------------------------- | --------------------------------- | ----------------------- |
| **A. One VPS with Docker** (recommended start)     | Full control, lowest monthly cost | Server updates, backups |
| **B. Managed platform** (Render, Railway, Fly.io…) | Least server work                 | Almost nothing          |

Whichever you pick, you need: the domain, a PostgreSQL database, an SMTP email account, and (recommended) an S3-compatible
bucket for uploads.

---

## A. VPS with Docker (DigitalOcean, Hetzner, AWS Lightsail, Hostinger VPS…)

Minimum: 2 vCPU, 2–4 GB RAM, 40 GB disk, Ubuntu 24.04.

1. **Point the domain at the server.** In your DNS, create an `A` record for `@` and for `www` → the server's IP.
2. **Install Docker** on the server: `curl -fsSL https://get.docker.com | sh`
3. **Get the code:** `git clone https://github.com/Shivam3-max/himbridge.git && cd himbridge`
4. **Configure:** `cp .env.production.example .env.production` and fill in every value:
   - `DOMAIN` / `APP_URL` — your domain
   - `POSTGRES_PASSWORD` — `openssl rand -base64 24`
   - `BETTER_AUTH_SECRET` — `openssl rand -base64 32`
   - `SMTP_URL`, `MAIL_FROM` — from your email provider (verification and reset emails depend on it)
5. **Start everything:**
   ```bash
   docker compose --env-file .env.production up -d --build
   ```
   This starts PostgreSQL, applies migrations, starts the app and Caddy. Caddy fetches the HTTPS certificate on first
   request (ports 80 and 443 must be open).
6. **Create the first admin.** Register a normal account on the site, then promote it:
   ```bash
   docker compose --env-file .env.production exec db psql -U himbridge -d himbridge \
     -c "update \"user\" set role='admin' where email='you@yourcompany.com';"
   ```
7. **Check:** `https://your-domain/api/health` should return `{"status":"ok"}`.

**Updating to a new version:** `git pull && docker compose --env-file .env.production up -d --build` (migrations run
automatically).

**Backups (do this on day one):**

- Database: schedule `docker compose exec -T db pg_dump -U himbridge himbridge | gzip > backup-$(date +%F).sql.gz` daily
  (cron) and copy it off the server.
- Uploads: back up the `uploads` Docker volume, or switch to `STORAGE_DRIVER=s3` so files live in a bucket.

---

## B. Managed platform

1. Create a **managed PostgreSQL** (Neon, Supabase, Render, Railway, AWS RDS…) and copy its connection string.
2. Create a web service from this repository using the **Dockerfile** (target `runner`), or with
   build `npm ci && npm run build`, start `npm start`.
3. Set environment variables: `DATABASE_URL`, `APP_URL`, `BETTER_AUTH_SECRET`, `SMTP_URL`, `MAIL_FROM`, and
   `STORAGE_DRIVER=s3` + `S3_*` (managed platforms usually have no persistent disk).
4. Add a release/pre-deploy command: `npm run db:migrate`.
5. Attach your domain in the platform's dashboard and follow its DNS instructions (HTTPS is automatic).
6. Promote your first admin with the SQL in step A6, using the platform's database console.

> Serverless hosts (e.g. Vercel) also work with a managed Postgres and S3 storage, since nothing in the app needs a
> local disk once `STORAGE_DRIVER=s3`.

---

## Before launch checklist

- [ ] `APP_URL` is the final `https://` domain (email links use it)
- [ ] Real `BETTER_AUTH_SECRET`, never the example value
- [ ] SMTP works: register a test account and receive the verification email (Admin → Email outbox shows status)
- [ ] **No demo data** — do not run `npm run db:seed` in production (it refuses unless `ALLOW_DEMO_SEED=true`)
- [ ] Daily database backup is running and a restore has been tested
- [ ] Uploads are backed up or on S3
- [ ] Terms of Use, Privacy Policy and refund/dispute policy published (About → Terms & privacy is a placeholder)
- [ ] Bank / LC details process agreed with the accounts desk (payments are confirmed manually by admins)
