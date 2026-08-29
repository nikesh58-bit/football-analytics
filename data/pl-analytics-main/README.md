# PL Analytics Pro

Professional football analytics platform with advanced statistics, shot maps, player comparisons, and tactical analysis for Premier League and major competitions.

## Features

- **Real-time Match Data** - Live scores, events, lineups with sub-minute updates
- **Advanced Analytics** - xG, xA, progressive passes, pressing metrics, defensive actions
- **Interactive Visualizations** - Shot maps (Canvas/WebGL), player radar charts, progression charts
- **Instant Search** - Meilisearch-powered typeahead across teams, players, competitions
- **Player Comparison** - Side-by-side stats, radar charts, career progression
- **Team Analysis** - Form guides, H2H, tactical breakdowns, squad depth
- **Subscription Billing** - Stripe-powered tiers (Free, Pro, Enterprise) with API access
- **RESTful API** - Rate-limited, cached, with OpenAPI documentation

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM |
| **Database** | PostgreSQL (primary), Redis (caching), Meilisearch (search) |
| **Charts** | Recharts, Canvas API (custom shot maps) |
| **Payments** | Stripe (subscriptions, webhooks, billing portal) |
| **Data** | Sportmonks / API-Football ingestion pipeline |
| **Deploy** | Docker, GitHub Actions, Vercel + Render/Railway |

## Project Structure

```
pl-analytics-pro/
├── backend/                 # Express API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, cache, validation
│   │   ├── lib/            # Prisma, Redis, Meilisearch, Stripe
│   │   └── jobs/           # Data ingestion workers
│   └── prisma/             # Database schema
├── frontend/                # Next.js App
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # React components
│   │   ├── hooks/          # SWR data fetching
│   │   ├── lib/            # API client
│   │   └── types/          # TypeScript types
├── shared/                  # Shared types & utilities
├── infra/                   # Docker, CI/CD
└── package.json            # Workspace root
```

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Meilisearch 1.8+

### Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Start infrastructure
npm run docker:up

# 4. Setup database
npm run db:generate
npm run db:migrate
npm run db:seed

# 5. Start development servers
npm run dev
```

### Access Points
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Meilisearch: http://localhost:7700
- Prisma Studio: `npm run db:studio` (backend)

## API Endpoints

### Teams
- `GET /api/teams` - List teams with filters
- `GET /api/teams/:id` - Team detail with form, squad, upcoming matches
- `GET /api/teams/:id/form` - Recent form (last 5/10)
- `GET /api/teams/:id/season-stats` - Season statistics
- `GET /api/teams/:id/h2h/:otherId` - Head-to-head

### Players
- `GET /api/players` - List players with filters
- `GET /api/players/:id` - Player profile with career stats
- `GET /api/players/:id/season-stats` - Season statistics
- `GET /api/players/:id/career` - Career aggregates
- `GET /api/players/compare?ids=1,2,3` - Compare players
- `GET /api/players/top/:metric` - Top performers by metric

### Matches
- `GET /api/matches` - List matches with filters
- `GET /api/matches/live` - Currently live matches
- `GET /api/matches/upcoming` - Upcoming fixtures
- `GET /api/matches/:id` - Match detail with events
- `GET /api/matches/:id/events` - Match events timeline

### Events & Visualizations
- `GET /api/events/shots` - Shot data for shot maps
- `GET /api/events/heatmap/:playerId` - Player activity heatmap
- `GET /api/events/pass-network` - Team pass network

### Analytics
- `GET /api/analytics/table/:seasonId` - League standings
- `GET /api/analytics/top-scorers/:seasonId` - Golden boot race
- `GET /api/analytics/radar/:playerId` - Player radar chart data
- `GET /api/analytics/progression/:playerId` - Metric progression

### Search
- `GET /api/search?q=` - Universal search (teams, players, competitions)
- `GET /api/search/teams?q=` - Team search
- `GET /api/search/players?q=` - Player search

### Billing
- `POST /api/billing/checkout` - Create Stripe checkout session
- `POST /api/billing/portal` - Create billing portal session
- `POST /api/billing/webhook` - Stripe webhook handler
- `GET /api/billing/prices` - Available subscription tiers

## Data Ingestion

```bash
# Full ingestion for Premier League (optaId: 8)
npx tsx backend/src/jobs/ingestion.ts 8

# Or via npm script
npm run ingest:pl
```

The pipeline:
1. Fetches competitions, seasons, teams, players from Sportmonks
2. Ingests fixtures and match events
3. Computes season aggregates (player/team stats)
4. Indexes to Meilisearch for instant search

## Subscription Tiers

| Feature | Free | Pro ($19/mo) | Enterprise |
|---------|------|--------------|------------|
| API Requests/day | 100 | 1,000 | 10,000+ |
| Historical Data | 1 season | 5 seasons | All |
| Shot Maps | ❌ | ✅ | ✅ |
| Player Radar | ❌ | ✅ | ✅ |
| Heatmaps | ❌ | ✅ | ✅ |
| API Access | ❌ | ✅ | ✅ |
| Webhooks | ❌ | ❌ | ✅ |
| SLA | ❌ | ❌ | 99.9% |

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete production deployment guide.

### Docker Production
```bash
docker-compose -f infra/docker/docker-compose.prod.yml up -d
```

### Manual
```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build && npm start
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Data Sources

- Match/event data: [Sportmonks](https://sportmonks.com/) / [API-Football](https://api-football.com/)
- Open data: [StatsBomb](https://statsbomb.com/) (selected competitions)
- Historical: Public domain football statistics

## Support

- 📧 Email: support@planalytics.pro
- 🐛 Issues: GitHub Issues
- 📖 Docs: `/docs` (when deployed)
- 📊 Status: `status.planalytics.pro`