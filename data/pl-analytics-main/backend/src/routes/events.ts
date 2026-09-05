import { Router } from 'express';
import { EventService } from '../services/event.service';
import { validateQuery, shotMapFiltersSchema } from '../middleware/validation';
import { cacheMiddleware, tierRateLimit } from '../middleware/cache';
import { apiKeyAuth, tierLimit, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Shot maps and heatmaps are Pro features per README subscription tiers.
router.get(
  '/shots',
  apiKeyAuth,
  tierLimit('PRO', 'ENTERPRISE'),
  tierRateLimit(),
  validateQuery(shotMapFiltersSchema),
  cacheMiddleware(300, 'events'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const shots = await EventService.getShots(req.validatedQuery);
      res.json(shots);
    } catch (error) {
      console.error('Error fetching shots:', error);
      res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch shots' });
    }
  },
);

router.get(
  '/heatmap/:playerId',
  apiKeyAuth,
  tierLimit('PRO', 'ENTERPRISE'),
  tierRateLimit(),
  cacheMiddleware(600, 'events'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { seasonId, competitionId } = req.query;
      const heatmap = await EventService.getHeatmap(
        req.params.playerId,
        seasonId as string,
        competitionId as string,
      );
      res.json(heatmap);
    } catch (error) {
      console.error('Error fetching heatmap:', error);
      res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch heatmap' });
    }
  },
);

export default router;
