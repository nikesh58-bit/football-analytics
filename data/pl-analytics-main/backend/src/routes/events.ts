import { Router } from 'express';
import { EventService } from '../services/event.service';
import { validateQuery, shotMapFiltersSchema } from '../middleware/validation';
import { cacheMiddleware } from '../middleware/cache';
import { optionalApiKey, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(optionalApiKey);

router.get('/shots', validateQuery(shotMapFiltersSchema), cacheMiddleware(300, 'events'), async (req: AuthenticatedRequest, res) => {
  try { const shots = await EventService.getShots(req.validatedQuery); res.json(shots); } catch (error) { console.error('Error fetching shots:', error); res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch shots' }); }
});

router.get('/heatmap/:playerId', cacheMiddleware(600, 'events'), async (req: AuthenticatedRequest, res) => {
  try { const { seasonId, competitionId } = req.query; const heatmap = await EventService.getHeatmap(req.params.playerId, seasonId as string, competitionId as string); res.json(heatmap); } catch (error) { console.error('Error fetching heatmap:', error); res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch heatmap' }); }
});

export default router;