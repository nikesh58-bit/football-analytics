import { prisma } from '../lib/prisma';
import { cacheKey, getCached, setCached } from '../lib/redis';
import { FilterParams } from '@pl-analytics/shared';

export class EventService {
  static async getShots(params: FilterParams = {}) {
    const key = cacheKey('events', 'shots', JSON.stringify(params));
    const cached = await getCached(key);
    if (cached) return cached;

    const { matchId, playerId, teamId, seasonId, competitionId, situation, outcome, bodyPart, limit = 500 } = params;
    const shotTypes = ['SHOT', 'SHOT_ON_TARGET', 'SHOT_OFF_TARGET', 'BLOCKED_SHOT', 'PENALTY', 'PENALTY_MISSED', 'GOAL'];
    
    const where: any = { type: { in: shotTypes } };
    if (matchId) where.matchId = matchId;
    if (playerId) where.playerId = playerId;
    if (teamId) where.teamId = teamId;
    if (situation) where.situation = situation;
    if (outcome) where.outcome = outcome;
    if (bodyPart) where.bodyPart = bodyPart;
    if (seasonId || competitionId) { where.match = {}; if (seasonId) where.match.seasonId = seasonId; if (competitionId) where.match.season = { competitionId }; }

    const shots = await prisma.matchEvent.findMany({ where, take: limit, orderBy: [{ minute: 'asc' }, { second: 'asc' }], include: { player: { select: { id: true, displayName: true, photoUrl: true, position: true } }, team: { select: { id: true, name: true, shortName: true, crestUrl: true } }, match: { select: { id: true, kickoffTime: true, homeTeam: { select: { id: true, name: true, shortName: true } }, awayTeam: { select: { id: true, name: true, shortName: true } }, homeScore: true, awayScore: true } } } });

    const transformed = shots.map(shot => ({ id: shot.id, player: shot.player, team: shot.team, match: shot.match, minute: shot.minute, second: shot.second, type: shot.type, x: shot.x, y: shot.y, endX: shot.endX, endY: shot.endY, bodyPart: shot.bodyPart, situation: shot.situation, outcome: shot.outcome, isGoal: shot.type === 'GOAL' || shot.type === 'PENALTY', xG: shot.xG || 0 }));
    await setCached(key, transformed, 300);
    return transformed;
  }

  static async getHeatmap(playerId: string, seasonId?: string, competitionId?: string) {
    const key = cacheKey('events', 'heatmap', playerId, seasonId || 'all', competitionId || 'all');
    const cached = await getCached(key);
    if (cached) return cached;

    const where: any = { playerId, x: { not: null }, y: { not: null } };
    if (seasonId || competitionId) { where.match = {}; if (seasonId) where.match.seasonId = seasonId; if (competitionId) where.match.season = { competitionId }; }

    const events = await prisma.matchEvent.findMany({ where, select: { x: true, y: true, type: true, minute: true }, take: 5000 });
    const gridSize = 10;
    const heatmap: number[][] = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
    
    events.forEach(e => { if (e.x !== null && e.y !== null) { const gx = Math.min(gridSize - 1, Math.floor((e.x / 100) * gridSize)); const gy = Math.min(gridSize - 1, Math.floor((e.y / 100) * gridSize)); heatmap[gy][gx] += 1; } });
    const max = Math.max(...heatmap.flat());
    const normalized = heatmap.map(row => row.map(v => max > 0 ? v / max : 0));

    const result = { grid: normalized, max, totalEvents: events.length };
    await setCached(key, result, 600);
    return result;
  }
}