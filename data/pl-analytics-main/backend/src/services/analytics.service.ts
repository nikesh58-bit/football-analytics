import { prisma } from '../lib/prisma';
import { cacheKey, getCached, setCached } from '../lib/redis';

export class AnalyticsService {
  static async getLeagueTable(seasonId: string) {
    const key = cacheKey('analytics', 'table', seasonId);
    const cached = await getCached(key);
    if (cached) return cached;

    const standings = await prisma.standing.findMany({ where: { seasonId }, orderBy: { position: 'asc' }, include: { team: { select: { id: true, name: true, shortName: true, crestUrl: true } } } });
    await setCached(key, standings, 300);
    return standings;
  }

  static async getTopScorers(seasonId: string, competitionId?: string, limit: number = 20) {
    const key = cacheKey('analytics', 'topscorers', seasonId, competitionId || 'all', limit);
    const cached = await getCached(key);
    if (cached) return cached;

    const where: any = { seasonId, goals: { gt: 0 } };
    if (competitionId) where.competitionId = competitionId;
    const stats = await prisma.playerSeasonStats.findMany({ where, orderBy: { goals: 'desc' }, take: limit, include: { player: { select: { id: true, displayName: true, photoUrl: true, nationality: true } }, team: { select: { id: true, name: true, shortName: true, crestUrl: true } } } });
    await setCached(key, stats, 300);
    return stats;
  }

  static async getTopAssists(seasonId: string, competitionId?: string, limit: number = 20) {
    const key = cacheKey('analytics', 'topassists', seasonId, competitionId || 'all', limit);
    const cached = await getCached(key);
    if (cached) return cached;

    const where: any = { seasonId, assists: { gt: 0 } };
    if (competitionId) where.competitionId = competitionId;
    const stats = await prisma.playerSeasonStats.findMany({ where, orderBy: { assists: 'desc' }, take: limit, include: { player: { select: { id: true, displayName: true, photoUrl: true } }, team: { select: { id: true, name: true, shortName: true, crestUrl: true } } } });
    await setCached(key, stats, 300);
    return stats;
  }

  static async getPlayerRadarData(playerId: string, seasonId: string, competitionId?: string) {
    const key = cacheKey('analytics', 'radar', playerId, seasonId, competitionId || 'all');
    const cached = await getCached(key);
    if (cached) return cached;

    const where: any = { playerId, seasonId };
    if (competitionId) where.competitionId = competitionId;
    const stats = await prisma.playerSeasonStats.findFirst({ where, include: { player: true, team: true } });
    if (!stats) return null;

    const metrics = [{ key: 'goals', label: 'Goals', value: stats.goals, max: 30 }, { key: 'assists', label: 'Assists', value: stats.assists, max: 15 }, { key: 'xG', label: 'xG', value: stats.xG, max: 25 }, { key: 'xA', label: 'xA', value: stats.xA, max: 12 }, { key: 'shots', label: 'Shots', value: stats.shots, max: 100 }, { key: 'keyPasses', label: 'Key Passes', value: stats.keyPasses, max: 50 }, { key: 'dribblesWon', label: 'Dribbles Won', value: stats.dribblesWon, max: 80 }, { key: 'tacklesWon', label: 'Tackles Won', value: stats.tacklesWon, max: 60 }, { key: 'interceptions', label: 'Interceptions', value: stats.interceptions, max: 50 }, { key: 'passAccuracy', label: 'Pass %', value: stats.passAccuracy, max: 100 }];
    const radar = metrics.map(m => ({ ...m, percentile: m.max > 0 ? Math.min(100, (m.value / m.max) * 100) : 0 }));
    await setCached(key, radar, 600);
    return radar;
  }
}