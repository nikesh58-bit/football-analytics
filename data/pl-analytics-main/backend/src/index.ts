import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { connectRedis, redis } from './lib/redis';
import { setupIndexes } from './lib/meilisearch';
import { prisma } from './lib/prisma';

import teamsRouter from './routes/teams';
import playersRouter from './routes/players';
import matchesRouter from './routes/matches';
import eventsRouter from './routes/events';
import analyticsRouter from './routes/analytics';
import searchRouter from './routes/search';
import billingRouter from './routes/billing';

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Stripe webhook signature verification requires the RAW request body,
// so this must be mounted before express.json parses it.
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, message: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' }, standardHeaders: true, legacyHeaders: false });
app.use(globalLimiter);

app.get('/health', (req, res) => { res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() }); });

app.use('/api/teams', teamsRouter);
app.use('/api/players', playersRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/events', eventsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/search', searchRouter);
app.use('/api/billing', billingRouter);

app.use((req, res) => { res.status(404).json({ code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` }); });

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => { console.error('Unhandled error:', err); res.status(500).json({ code: 'INTERNAL_ERROR', message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message }); });

let server: ReturnType<typeof app.listen> | null = null;

async function start() {
  // Only the database is a hard dependency. Cache/search degrade gracefully if unavailable.
  try {
    await prisma.$connect(); console.log('✅ Database connected');
  } catch (error) { console.error('❌ Failed to connect to database:', error); process.exit(1); }

  try {
    await connectRedis(); console.log('✅ Redis connected');
  } catch (error) { console.warn('⚠️ Redis unavailable, caching disabled:', (error as Error).message); }

  try {
    await setupIndexes(); console.log('✅ Meilisearch indexes ready');
  } catch (error) { console.warn('⚠️ Meilisearch unavailable, search disabled:', (error as Error).message); }

  server = app.listen(PORT, () => { console.log(`🚀 Backend server running on http://localhost:${PORT}`); });
}

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down gracefully`);
  if (server) server.close(async () => {
    try { await prisma.$disconnect(); } catch {}
    try { await redis.quit().catch(() => {}); } catch {}
    process.exit(0);
  });
  // Force-exit if connections don't drain in time
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();

export default app;