import { Router } from 'express';
import { MatchService } from '../services/match.service';
import { validateQuery, matchFiltersSchema, eventFiltersSchema } from '../middleware/validation';
import { cacheMiddleware, tierRateLimit } from '../middleware/cache';
import { optionalApiKey, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(optionalApiKey);
router.use(tierRateLimit());

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = parseInt(value as string, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

router.get('/', validateQuery(matchFiltersSchema), cacheMiddleware(60, 'matches'), async (req: AuthenticatedRequest, res) => {
  try {
    const result = await MatchService.getAll(req.validatedQuery);
    res.json(result);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch matches' });
  }
});

router.get('/live', cacheMiddleware(15, 'matches'), async (req: AuthenticatedRequest, res) => {
  try {
    const matches = await MatchService.getLiveMatches();
    res.json(matches);
  } catch (error) {
    console.error('Error fetching live matches:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch live matches' });
  }
});

router.get('/upcoming', cacheMiddleware(300, 'matches'), async (req: AuthenticatedRequest, res) => {
  try {
    const limit = clampInt(req.query.limit, 10, 1, 50);
    const matches = await MatchService.getUpcomingMatches(limit);
    res.json(matches);
  } catch (error) {
    console.error('Error fetching upcoming matches:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch upcoming matches' });
  }
});

router.get('/:id', cacheMiddleware(60, 'matches'), async (req: AuthenticatedRequest, res) => {
  try {
    const match = await MatchService.getById(req.params.id);
    if (!match) return res.status(404).json({ code: 'NOT_FOUND', message: 'Match not found' });
    res.json(match);
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch match' });
  }
});

router.get('/:id/events', validateQuery(eventFiltersSchema), cacheMiddleware(60, 'matches'), async (req: AuthenticatedRequest, res) => {
  try {
    const events = await MatchService.getMatchEvents(req.params.id, req.validatedQuery);
    res.json(events);
  } catch (error) {
    console.error('Error fetching match events:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch match events' });
  }
});

export default router;
