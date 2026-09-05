import { Router } from 'express';
import { searchAll, searchTeams, searchPlayers } from '../lib/meilisearch';
import { cacheMiddleware } from '../middleware/cache';
import { optionalApiKey, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(optionalApiKey);

// Meilisearch filter values must escape embedded quotes to prevent filter injection.
function esc(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function intParam(value: unknown, fallback: number, min = 1, max = 50): number {
  const n = parseInt(value as string, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

router.get('/', cacheMiddleware(300, 'search'), async (req: AuthenticatedRequest, res) => {
  try { const { q, limit = 5 } = req.query; if (!q || (q as string).length < 2) return res.json({ teams: { hits: [] }, players: { hits: [] }, competitions: { hits: [] } }); const results = await searchAll(q as string, intParam(limit, 5)); res.json(results); } catch (error) { console.error('Search error:', error); res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Search failed' }); }
});

router.get('/teams', cacheMiddleware(300, 'search'), async (req: AuthenticatedRequest, res) => {
  try { const { q, limit = 10, country } = req.query; if (!q || (q as string).length < 2) return res.json({ hits: [] }); const filter = country ? `country = "${esc(country as string)}"` : undefined; const results = await searchTeams(q as string, { limit: intParam(limit, 10), filter }); res.json(results); } catch (error) { console.error('Team search error:', error); res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Team search failed' }); }
});

router.get('/players', cacheMiddleware(300, 'search'), async (req: AuthenticatedRequest, res) => {
  try { const { q, limit = 10, teamId, position } = req.query; if (!q || (q as string).length < 2) return res.json({ hits: [] }); const filters: string[] = []; if (teamId) filters.push(`teamId = "${esc(teamId as string)}"`); if (position) filters.push(`position = "${esc(position as string)}"`); const filter = filters.length > 0 ? filters.join(' AND ') : undefined; const results = await searchPlayers(q as string, { limit: intParam(limit, 10), filter }); res.json(results); } catch (error) { console.error('Player search error:', error); res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Player search failed' }); }
});

export default router;
