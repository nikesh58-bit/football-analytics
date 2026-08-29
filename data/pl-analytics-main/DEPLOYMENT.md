# PL Analytics Pro - Production Deployment Guide

## Quick Start (Docker)

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