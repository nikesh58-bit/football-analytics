import { Router } from 'express';
import { z } from 'zod';
import { apiKeyAuth, tierLimit, AuthenticatedRequest } from '../middleware/auth';
import { enqueueCompetitionIngest } from '../queues/ingestion.queue';

const router = Router();

const enqueueSchema = z.object({ optaCompetitionId: z.coerce.number().int().positive().max(100000) });

// Enqueue is PRO+ (writes + external API cost). Workers run separately:
// `npm run worker --workspace=backend`.
router.post('/ingest', apiKeyAuth, tierLimit('PRO', 'ENTERPRISE'), async (req: AuthenticatedRequest, res) => {
  const parsed = enqueueSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'optaCompetitionId required', details: parsed.error.flatten().fieldErrors });
  try {
    const job = await enqueueCompetitionIngest(parsed.data.optaCompetitionId);
    res.status(202).json({ jobId: job.id, queue: 'ingestion' });
  } catch (error) {
    res.status(503).json({ code: 'QUEUE_UNAVAILABLE', message: 'Redis queue unavailable' });
  }
});

export default router;
