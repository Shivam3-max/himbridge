# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────
# Himbridge portal — production image
#   docker build -t himbridge .                 (app image, target "runner")
#   docker build -t himbridge-migrate --target migrator .
# ─────────────────────────────────────────────────────────────

FROM node:24-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# 1. Install dependencies (cached unless package files change)
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# 2. Build the app
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Placeholders so configuration validation passes while building; real values are supplied at runtime.
ENV DATABASE_URL=postgres://build:build@localhost:5432/build \
    BETTER_AUTH_SECRET=build-time-placeholder-secret-not-used-at-runtime \
    APP_URL=http://localhost:3000
RUN npm run build

# 3. One-shot migration runner (has the full toolchain; runs `npm run db:migrate` and exits)
FROM builder AS migrator
ENV NODE_ENV=production
CMD ["npm", "run", "db:migrate"]

# 4. Small runtime image with only the standalone server
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOAD_DIR=/app/data/uploads
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs \
  && mkdir -p /app/data/uploads && chown -R nextjs:nodejs /app/data
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
