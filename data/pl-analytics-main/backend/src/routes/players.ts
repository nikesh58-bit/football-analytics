import { Router } from 'express';
import { PlayerService } from '../services/player.service';
import { validateQuery, playerFiltersSchema } from '../middleware/validation';
import { cacheMiddleware } from '../middleware/cache';
import { optionalApiKey, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(optionalApiKey);

function intParam(value: unknown, fallback: number): number {
  const n = parseInt(value as string, 10);
  return Number.isFinite(n) ? n : fallback;
}

// NOTE: static/specific routes MUST be registered before '/:id',
// otherwise Express captures them as an :id match.
router.get('/', validateQuery(playerFiltersSchema), cacheMiddleware(300, 'players'), async (req: AuthenticatedRequest, res) => {
  try { const result = await PlayerService.getAll(req.validatedQuery); res.json(result); } catch (error) { console.error('Error fetching players:', error); res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch players' }); }
});

router.get('/compare', cacheMiddleware(600, 'players'), async (req: AuthenticatedRequest, res) => {
  try { const { ids, seasonId, competitionId } = req.query; if (!ids) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'ids parameter required (comma-separated)' }); const playerIds = (ids as string).split(',').filter(Boolean); const comparison = await PlayerService.comparePlayers(playerIds, seasonId as string, competitionId as string); res.json(comparison); } catch (error) { console.error('Error comparing players:', error); res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to compare players' }); }
});

router.get('/top/:metric', cacheMiddleware(300, 'players'), async (req: AuthenticatedRequest, res) => {
  try { const { metric } = req.params; const { seasonId, competitionId, teamId } = req.query; const top = await PlayerService.getTopPerformers(metric, { seasonId: seasonId as string, competitionId: competitionId as string, teamId: teamId as string, minMinutes: intParam(req.query.minMinutes, 270), limit: intParam(req.query.limit, 20) }); res.json(top); } catch (error) { console.error('Error fetching top performers:', error); res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch top performers' }); }
});

router.get('/:id', cacheMiddleware(300, 'players'), async (req: AuthenticatedRequest, res) => {
  try { const player = await PlayerService.getById(req.params.id); if (!player) return res.status(404).json({ code: 'NOT_FOUND', message: 'Player not found' }); res.json(player); } catch (error) { console.error('Error fetching player:', error); res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch player' }); }
});

router.get('/:id/season-stats', cacheMiddleware(600, 'players'), async (req: AuthenticatedRequest, res) => {
  try { const { seasonId, competitionId } = req.query; if (!seasonId) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'seasonId is required' }); const stats = await PlayerService.getSeasonStats(req.params.id, seasonId as string, competitionId as string); if (!stats) return res.status(404).json({ code: 'NOT_FOUND', message: 'Season stats not found' }); res.json(stats); } catch (error) { console.error('Error fetching player season stats:', error); res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch season stats' }); }
});

router.get('/:id/career', cacheMiddleware(600, 'players'), async (req: AuthenticatedRequest, res) => {
  try { const career = await PlayerService.getCareerStats(req.params.id); res.json(career); } catch (error) { console.error('Error fetching career stats:', error); res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch career stats' }); }
});

export default router;
