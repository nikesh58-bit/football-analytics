import { prisma } from '../lib/prisma';
import { cacheKey, getCached, setCached } from '../lib/redis';
import { PaginatedResponse, FilterParams } from '@pl-analytics/shared';

export class PlayerService {
  static async getAll(params: FilterParams = {}): Promise<PaginatedResponse<any>> {
    const key = cacheKey('players', 'list', JSON.stringify(params));
    const cached = await getCached<PaginatedResponse<any>>(key);
    if (cached) return cached;

    const { teamId, competitionId, seasonId, position, nationality, minMinutes = 0, search, limit = 20, offset = 0, sortBy = 'goals', sortOrder = 'desc' } = params;
    const seasonScoped = Boolean(seasonId || competitionId);

    const playerWhere: any = {};
    if (teamId) playerWhere.currentTeamId = teamId;
    if (nationality) playerWhere.nationality = nationality;
    if (position) playerWhere.position = position;
    if (search) playerWhere.OR = [{ displayName: { contains: search, mode: 'insensitive' } }, { firstName: { contains: search, mode: 'insensitive' } }, { lastName: { contains: search, mode: 'insensitive' } }];

    if (seasonScoped) {
      // Season-scoped listing must sort by the STAT value, not by the Player row.
      // Query PlayerSeasonStats directly and shape the result to look like Player rows.
      const statsWhere: any = { player: playerWhere };
      if (seasonId) statsWhere.seasonId = seasonId;
      if (competitionId) statsWhere.competitionId = competitionId;
      if (minMinutes > 0) statsWhere.minutesPlayed = { gte: minMinutes };

      const validSortFields = new Set(['goals', 'assists', 'xG', 'xA', 'minutesPlayed', 'appearances']);
      const orderField = validSortFields.has(sortBy as string) ? (sortBy as string) : 'goals';

      const [stats, statRows] = await Promise.all([
        prisma.playerSeasonStats.findMany({ where: statsWhere, orderBy: { [orderField]: sortOrder }, take: limit, skip: offset, include: { player: { include: { currentTeam: { select: { id: true, name: true, shortName: true, crestUrl: true } } } }, team: true, season: true, competition: true } }),
        prisma.playerSeasonStats.findMany({ where: statsWhere, select: { playerId: true } }),
      ]);

      const result: PaginatedResponse<any> = { data: stats.map(s => ({ ...s.player, seasonStats: [{ ...s, player: undefined }] })), total: new Set(statRows.map(r => r.playerId)).size, page: Math.floor(offset / limit) + 1, pageSize: limit, totalPages: Math.ceil(new Set(statRows.map(r => r.playerId)).size / limit) };
      await setCached(key, result, 300);
      return result;
    }

    if (minMinutes > 0) playerWhere.seasonStats = { some: { minutesPlayed: { gte: minMinutes } } };

    const [data, total] = await Promise.all([
      prisma.player.findMany({ where: playerWhere, take: limit, skip: offset, include: { currentTeam: { select: { id: true, name: true, shortName: true, crestUrl: true } } } }),
      prisma.player.count({ where: playerWhere }),
    ]);

    const result: PaginatedResponse<any> = { data, total, page: Math.floor(offset / limit) + 1, pageSize: limit, totalPages: Math.ceil(total / limit) };
    await setCached(key, result, 300);
    return result;
  }

  static async getById(id: string) {
    const key = cacheKey('players', 'detail', id);
    const cached = await getCached(key);
    if (cached) return cached;

    const player = await prisma.player.findUnique({
      where: { id },
      include: { currentTeam: true, seasonStats: { include: { season: true, competition: true, team: true }, orderBy: { season: { startDate: 'desc' } } } },
    });

    if (player) await setCached(key, player, 300);
    return player;
  }

  static async getSeasonStats(playerId: string, seasonId: string, competitionId?: string) {
    const key = cacheKey('players', 'season-stats', playerId, seasonId, competitionId || 'all');
    const cached = await getCached(key);
    if (cached) return cached;

    const where: any = { playerId, seasonId };
    if (competitionId) where.competitionId = competitionId;
    const stats = await prisma.playerSeasonStats.findFirst({ where, include: { team: true, season: true, competition: true } });
    if (stats) await setCached(key, stats, 600);
    return stats;
  }

  static async getCareerStats(playerId: string) {
    const key = cacheKey('players', 'career', playerId);
    const cached = await getCached(key);
    if (cached) return cached;

    const stats = await prisma.playerSeasonStats.findMany({ where: { playerId }, include: { season: true, competition: true, team: true }, orderBy: { season: { startDate: 'desc' } } });
    const career = stats.reduce((acc, s) => ({ appearances: acc.appearances + s.appearances, minutesPlayed: acc.minutesPlayed + s.minutesPlayed, goals: acc.goals + s.goals, assists: acc.assists + s.assists, xG: acc.xG + s.xG, xA: acc.xA + s.xA, shots: acc.shots + s.shots, shotsOnTarget: acc.shotsOnTarget + s.shotsOnTarget }), { appearances: 0, minutesPlayed: 0, goals: 0, assists: 0, xG: 0, xA: 0, shots: 0, shotsOnTarget: 0 });
    await setCached(key, { career, bySeason: stats }, 600);
    return { career, bySeason: stats };
  }

  static async comparePlayers(playerIds: string[], seasonId?: string, competitionId?: string) {
    const key = cacheKey('players', 'compare', playerIds.sort().join(','), seasonId || 'all', competitionId || 'all');
    const cached = await getCached(key);
    if (cached) return cached;

    const where: any = { playerId: { in: playerIds } };
    if (seasonId) where.seasonId = seasonId;
    if (competitionId) where.competitionId = competitionId;
    const stats = await prisma.playerSeasonStats.findMany({ where, include: { player: true, team: true } });
    await setCached(key, stats, 600);
    return stats;
  }

  static async getTopPerformers(metric: string, params: FilterParams = {}) {
    const key = cacheKey('players', 'top', metric, JSON.stringify(params));
    const cached = await getCached(key);
    if (cached) return cached;

    const validMetrics = ['goals', 'assists', 'xG', 'xA', 'goals_p90', 'xg_p90', 'assists_p90', 'xa_p90'];
    if (!validMetrics.includes(metric)) metric = 'goals';

    const { seasonId, competitionId, teamId, minMinutes = 270, limit = 20 } = params;
    const per90Metrics = ['goals_p90', 'xg_p90', 'assists_p90', 'xa_p90'];
    const isPer90 = per90Metrics.includes(metric);

    const where: any = { minutesPlayed: { gte: minMinutes } };
    if (seasonId) where.seasonId = seasonId;
    if (competitionId) where.competitionId = competitionId;
    if (teamId) where.teamId = teamId;

    if (isPer90) {
      const field = metric.replace('_p90', '');
      const rows = await prisma.playerSeasonStats.findMany({ where, include: { player: true, team: true }, take: 2000 });
      const stats = rows
        .map(r => ({ ...r, per90: r.minutesPlayed > 0 ? ((r as any)[field === 'xg' ? 'xG' : field === 'xa' ? 'xA' : field] / r.minutesPlayed) * 90 : 0 }))
        .sort((a, b) => b.per90 - a.per90)
        .slice(0, limit);
      await setCached(key, stats, 300);
      return stats;
    }

    const stats = await prisma.playerSeasonStats.findMany({ where, orderBy: { [metric]: 'desc' }, take: limit, include: { player: true, team: true } });
    await setCached(key, stats, 300);
    return stats;
  }
}
