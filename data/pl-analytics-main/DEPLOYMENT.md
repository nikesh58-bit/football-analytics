# PL Analytics Pro - Production Deployment Guide

## Recommended setup: Render (backend + infra) + Vercel (frontend)

The repo root contains `render.yaml` — a Render Blueprint that provisions **everything**
(PostgreSQL, Redis, Meilisearch, backend API). The frontend can run either on Render
(included in the blueprint) or on Vercel (recommended for Next.js).

### Option A — Everything on Render (Blueprint, ~10 minutes)

1. Push this repo to GitHub (done).
2. Go to https://dashboard.render.com → **New +** → **Blueprint**.
3. Select the `football-analytics` repository. Render auto-detects `render.yaml` at the repo root.
4. Review the 5 services it will create:
   - `pl-postgres` (free Postgres — expires after 30 days, upgrade for real use)
   - `pl-redis` (free Key Value)
   - `pl-meilisearch` (Docker image, starter plan because it needs a disk)
   - `pl-backend` (Docker, runs `prisma db push` + seed on every deploy)
   - `pl-frontend` (Docker, optional if you use Vercel instead)
5. Click **Apply**. When prompted, fill in the `sync: false` vars (Stripe keys — or leave blank).
6. First deploy takes ~5–10 min. Backend health check: `https://pl-backend-xxxx.onrender.com/health`.

> The blueprint deploys the frontend on Render too. If you'd rather use Vercel for the
> frontend, delete the `pl-frontend` service in the Render dashboard after the first deploy.

### Option B — Backend on Render, frontend on Vercel

**Render:** same as Option A (keep or delete the `pl-frontend` service).

**Vercel:**

1. https://vercel.com → **Add New** → **Project** → import `football-analytics`.
2. Configure:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `data/pl-analytics-main/frontend`
   - **Build Command:** leave default — the `vercel-build` script in `frontend/package.json`
     installs the whole workspace and builds `shared` before `next build`
   - **Install Command:** `echo "skipped (vercel-build handles install)"`
3. Environment Variables (Production + Preview):
   - `NEXT_PUBLIC_API_URL` = `https://pl-backend-xxxx.onrender.com` (your Render backend URL, no trailing slash)
4. Deploy.

> `NEXT_PUBLIC_API_URL` is baked into the client bundle at **build** time. If you later
> change the backend URL, redeploy the frontend.

### Post-deploy checklist

- [ ] Open `https://<backend>/health` → `{"status":"ok"}`
- [ ] Open the frontend URL — pages will show empty states until data is ingested
- [ ] (Stripe) add webhook endpoint `https://<backend>/api/billing/webhook` and set `STRIPE_WEBHOOK_SECRET`
- [ ] (Custom domain) add in Vercel/Render and update `FRONTEND_URL` on the backend + `NEXT_PUBLIC_API_URL` on the frontend, then redeploy

### Free-tier caveats

| Service | Free tier behaviour |
|---|---|
| Render web services | Spin down after 15 min idle → first request takes ~50 s |
| Render Postgres (free) | Expires after 30 days |
| Render Key Value (free) | 25 MB, fine for caching |
| Meilisearch | Needs a paid instance (disk); data is lost without one |
| Vercel (Hobby) | Free for non-commercial; serverless functions have 10 s timeout |

## Quick Start (Docker, local)

```bash
# 1. Clone and configure
git clone <repo>
cd pl-analytics-pro
cp .env.example .env
# Edit .env with your keys

# 2. Start all services
npm run docker:up

# 3. Initialize database
npm run db:generate
npm run db:migrate
npm run db:seed

# 4. Access
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# Meilisearch: http://localhost:7700
```

## Production Deployment

### 1. Infrastructure Requirements

| Service | Spec | Provider Options |
|---------|------|------------------|
| PostgreSQL | 4 vCPU, 16GB RAM, 500GB SSD | AWS RDS, Google Cloud SQL, Supabase, Neon |
| Redis | 2 vCPU, 8GB RAM | AWS ElastiCache, Upstash, Redis Cloud |
| Meilisearch | 2 vCPU, 8GB RAM | Meilisearch Cloud, self-hosted |
| Backend | 2 vCPU, 4GB RAM | Render, Railway, Fly.io, AWS ECS |
| Frontend | Static + Edge | Vercel (recommended), Netlify, Cloudflare Pages |

### 2. Environment Variables (Production)

```env
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
REDIS_URL="rediss://user:pass@host:6379"
MEILISEARCH_HOST="https://your-meilisearch.com"
MEILISEARCH_API_KEY="production_key"
SPORTMONKS_TOKEN="production_token"
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
FRONTEND_URL="https://yourdomain.com"
NODE_ENV="production"
```

### 3. Database Migration

```bash
# Run migrations
npm run db:migrate:prod

# Or with Docker
docker-compose -f infra/docker/docker-compose.prod.yml run backend npm run db:migrate:prod
```

### 4. Frontend Deployment (Vercel)

1. Connect GitHub repo to Vercel
2. Set Root Directory: `frontend`
3. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL` = `https://api.yourdomain.com`
4. Deploy

### 5. Backend Deployment (Render/Railway)

1. Create Web Service from GitHub
2. Root Directory: `backend`
3. Build Command: `npm ci && npm run build`
4. Start Command: `npm start`
5. Add all environment variables
6. Set up Redis/PostgreSQL add-ons

### 6. Meilisearch Setup

```bash
# Create indexes after deployment
curl -X POST 'https://your-meilisearch.com/indexes' \
  -H 'Authorization: Bearer YOUR_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"uid": "teams", "primaryKey": "id"}'

# Repeat for players, competitions, matches
```

### 7. Stripe Configuration

1. Create products/prices in Stripe Dashboard
2. Set up webhook endpoint: `https://api.yourdomain.com/api/billing/webhook`
3. Subscribe to events: `customer.subscription.*`, `invoice.payment_failed`
4. Add price IDs to environment variables

### 8. Custom Domain

1. Add domain in Vercel (frontend) and Render (backend)
2. Configure DNS:
   - `CNAME www` → `cname.vercel-dns.com`
   - `CNAME api` → `your-app.onrender.com`
3. Enable HTTPS (automatic on both platforms)

### 9. Monitoring & Alerts

- **Sentry**: Add DSN to both frontend/backend
- **Uptime**: UptimeRobot / Better Uptime
- **Logs**: Datadog / Logtail / Axiom
- **Metrics**: Prometheus + Grafana (if self-hosted)

### 10. Backup Strategy

- PostgreSQL: Daily automated backups (RDS/Cloud SQL)
- Redis: RDB snapshots every 60s
- Meilisearch: Daily snapshot exports

## Scaling Checklist

- [ ] CDN caching for static assets
- [ ] Redis cluster for high availability
- [ ] PostgreSQL read replicas
- [ ] Meilisearch cluster
- [ ] Backend horizontal scaling (stateless)
- [ ] Rate limiting per tier
- [ ] Database connection pooling (PgBouncer)

## Security

- [ ] WAF (Cloudflare / AWS WAF)
- [ ] API key rotation
- [ ] Regular dependency updates
- [ ] CSP headers
- [ ] CORS properly configured
- [ ] Secrets in vault (not env files)

## Support

- Documentation: `/docs`
- API Reference: `/api-docs`
- Status Page: `status.yourdomain.com`