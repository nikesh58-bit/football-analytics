import { Router } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { cacheMiddleware, tierRateLimit } from '../middleware/cache';
import { apiKeyAuth, optionalApiKey, tierLimit, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(optionalApiKey);

function intParam(value: unknown, fallback: number, min = 1, max = 100): number {
  const n = parseInt(value as string, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

router.get('/table/:seasonId', cacheMiddleware(300, 'analytics'), async (req: AuthenticatedRequest, res) => {
  try {
    const table = await AnalyticsService.getLeagueTable(req.params.seasonId);
    res.json(table);
  } catch (error) {
    console.error('Error fetching league table:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch league table' });
  }
});

router.get('/top-scorers/:seasonId', cacheMiddleware(300, 'analytics'), async (req: AuthenticatedRequest, res) => {
  try {
    const { competitionId, limit = 20 } = req.query;
    const scorers = await AnalyticsService.getTopScorers(
      req.params.seasonId,
      competitionId as string,
      intParam(limit, 20, 1, 100),
    );
    res.json(scorers);
  } catch (error) {
    console.error('Error fetching top scorers:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch top scorers' });
  }
});

router.get('/top-assists/:seasonId', cacheMiddleware(300, 'analytics'), async (req: AuthenticatedRequest, res) => {
  try {
    const { competitionId, limit = 20 } = req.query;
    const assists = await AnalyticsService.getTopAssists(
      req.params.seasonId,
      competitionId as string,
      intParam(limit, 20, 1, 100),
    );
    res.json(assists);
  } catch (error) {
    console.error('Error fetching top assists:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch top assists' });
  }
});

// Player radar is a Pro feature per README subscription tiers.
router.get(
  '/radar/:playerId',
  apiKeyAuth,
  tierLimit('PRO', 'ENTERPRISE'),
  tierRateLimit(),
  cacheMiddleware(600, 'analytics'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { seasonId, competitionId } = req.query;
      if (!seasonId) {
        return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'seasonId is required' });
      }
      const radar = await AnalyticsService.getPlayerRadarData(
        req.params.playerId,
        seasonId as string,
        competitionId as string,
      );
      if (!radar) return res.status(404).json({ code: 'NOT_FOUND', message: 'Player stats not found' });
      res.json(radar);
    } catch (error) {
      console.error('Error fetching radar data:', error);
      res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch radar data' });
    }
  },
);

export default router;
