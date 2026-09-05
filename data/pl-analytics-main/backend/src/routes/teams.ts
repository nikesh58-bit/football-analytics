import { Router } from 'express';
import { TeamService } from '../services/team.service';
import { validateQuery, teamFiltersSchema } from '../middleware/validation';
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

router.get('/', validateQuery(teamFiltersSchema), cacheMiddleware(300, 'teams'), async (req: AuthenticatedRequest, res) => {
  try {
    const result = await TeamService.getAll(req.validatedQuery);
    res.json(result);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch teams' });
  }
});

router.get('/:id', cacheMiddleware(300, 'teams'), async (req: AuthenticatedRequest, res) => {
  try {
    const team = await TeamService.getById(req.params.id);
    if (!team) return res.status(404).json({ code: 'NOT_FOUND', message: 'Team not found' });
    res.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch team' });
  }
});

router.get('/:id/form', cacheMiddleware(300, 'teams'), async (req: AuthenticatedRequest, res) => {
  try {
    const limit = clampInt(req.query.limit, 5, 1, 20);
    const form = await TeamService.getForm(req.params.id, limit);
    res.json(form);
  } catch (error) {
    console.error('Error fetching team form:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch team form' });
  }
});

router.get('/:id/season-stats', cacheMiddleware(600, 'teams'), async (req: AuthenticatedRequest, res) => {
  try {
    const { seasonId } = req.query;
    if (!seasonId) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'seasonId is required' });
    const stats = await TeamService.getSeasonStats(req.params.id, seasonId as string);
    if (!stats) return res.status(404).json({ code: 'NOT_FOUND', message: 'Season stats not found' });
    res.json(stats);
  } catch (error) {
    console.error('Error fetching team season stats:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch season stats' });
  }
});

router.get('/:id/h2h/:otherId', cacheMiddleware(600, 'teams'), async (req: AuthenticatedRequest, res) => {
  try {
    const limit = clampInt(req.query.limit, 10, 1, 50);
    const h2h = await TeamService.getHeadToHead(req.params.id, req.params.otherId, limit);
    res.json(h2h);
  } catch (error) {
    console.error('Error fetching H2H:', error);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch head-to-head' });
  }
});

export default router;
