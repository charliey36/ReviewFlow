# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# 1. deps — install dependencies only (cached separately from source changes)
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# 2. builder — build the Next.js app (standalone output)
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Install the public CA bundle, then add this machine's corporate TLS-
# inspecting proxy root CA (Zscaler) on top of it. Outbound HTTPS from this
# network is intercepted and re-signed by Zscaler, so without its root CA
# trusted, Node's TLS verification fails with "unable to get local issuer
# certificate" even though the public CA bundle is otherwise complete and
# up to date. See docker/certs/zscaler-root-ca.pem — exported from this
# host's own OS trust store, where it was already installed by IT policy.
# NOT NEEDED at all on a network without this kind of TLS interception —
# if you hit CA errors on a different machine/network, this file and the
# two COPY/update-ca-certificates lines below can likely be removed.
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY docker/certs/zscaler-root-ca.pem /usr/local/share/ca-certificates/zscaler-root-ca.crt
RUN update-ca-certificates

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars: Next.js inlines NEXT_PUBLIC_* variables into the
# client bundle at build time, so they must be available now, not just at
# runtime. Passed in via docker-compose's `args:` (see docker-compose.yml).
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN npm run build

# ---------------------------------------------------------------------------
# 3. runner — minimal final image, only the standalone output
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runner
WORKDIR /app

# Same corporate-proxy CA trust setup as the builder stage above — needed
# here too since this stage is what actually makes runtime API calls to
# Supabase and Resend.
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY docker/certs/zscaler-root-ca.pem /usr/local/share/ca-certificates/zscaler-root-ca.crt
RUN update-ca-certificates

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Points Node at the OS CA bundle (public CAs + the corporate proxy CA added
# above) so it can verify certs for HTTPS endpoints its own built-in root
# store doesn't cover. Node does not consult the OS trust store on its own —
# this env var is required even though update-ca-certificates already ran.
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

# Run as a non-root user (recommended by the official Next.js Docker example).
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone output already contains a pruned node_modules — no npm install
# needed in this final stage.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Copy public/ only if it exists — harmless no-op otherwise since standalone
# output doesn't include it by default and this repo has no public/ dir yet.
COPY --from=builder /app/public ./public

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
