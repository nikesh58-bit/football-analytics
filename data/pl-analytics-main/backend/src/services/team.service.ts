import { prisma } from '../lib/prisma';
import { cacheKey, getCached, setCached } from '../lib/redis';
import { PaginatedResponse, FilterParams } from '@pl-analytics/shared';

export class TeamService {
  static async getAll(params: FilterParams = {}): Promise<PaginatedResponse<any>> {
    const key = cacheKey('teams', 'list', JSON.stringify(params));
    const cached = await getCached<PaginatedResponse<any>>(key);
    if (cached) return cached;

    const { competitionId, country, search, limit = 20, offset = 0 } = params;
    
    const where: any = {};
    if (competitionId) where.seasons = { some: { competitionId } };
    if (country) where.country = country;
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { shortName: { contains: search, mode: 'insensitive' } }];

    const [data, total] = await Promise.all([
      prisma.team.findMany({ where, take: limit, skip: offset, orderBy: { name: 'asc' }, include: { _count: { select: { players: true, homeMatches: true, awayMatches: true } } } }),
      prisma.team.count({ where }),
    ]);

    const result = { data, total, page: Math.floor(offset / limit) + 1, pageSize: limit, totalPages: Math.ceil(total / limit) };
    await setCached(key, result, 300);
    return result;
  }

  static async getById(id: string) {
    const key = cacheKey('teams', 'detail', id);
    const cached = await getCached(key);
    if (cached) return cached;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        seasonStats: { where: { season: { isCurrent: true } }, include: { season: true } },
        players: { where: { currentTeamId: id }, orderBy: { displayName: 'asc' } },
        homeMatches: { where: { status: { in: ['SCHEDULED', 'LIVE', 'HT'] } }, orderBy: { kickoffTime: 'asc' }, take: 5, include: { awayTeam: true, season: true } },
        awayMatches: { where: { status: { in: ['SCHEDULED', 'LIVE', 'HT'] } }, orderBy: { kickoffTime: 'asc' }, take: 5, include: { homeTeam: true, season: true } },
      },
    });

    if (team) await setCached(key, team, 300);
    return team;
  }

  static async getSeasonStats(teamId: string, seasonId: string) {
    const key = cacheKey('teams', 'season-stats', teamId, seasonId);
    const cached = await getCached(key);
    if (cached) return cached;

    const stats = await prisma.teamSeasonStats.findFirst({ where: { teamId, seasonId } });
    if (stats) await setCached(key, stats, 600);
    return stats;
  }

  static async getForm(teamId: string, limit: number = 5) {
    const key = cacheKey('teams', 'form', teamId, limit);
    const cached = await getCached(key);
    if (cached) return cached;

    const matches = await prisma.match.findMany({
      where: { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }], status: { in: ['FT', 'AET', 'PEN'] } },
      orderBy: { kickoffTime: 'desc' }, take: limit,
      include: { homeTeam: { select: { id: true, name: true, shortName: true, crestUrl: true } }, awayTeam: { select: { id: true, name: true, shortName: true, crestUrl: true } } },
    });

    const form = matches.map(m => {
      const isHome = m.homeTeamId === teamId;
      const teamScore = isHome ? m.homeScore : m.awayScore;
      const oppScore = isHome ? m.awayScore : m.homeScore;
      if (teamScore === null || oppScore === null) return 'D';
      if (teamScore > oppScore) return 'W';
      if (teamScore < oppScore) return 'L';
      return 'D';
    }).join('');

    await setCached(key, { form, matches }, 300);
    return { form, matches };
  }

  static async getHeadToHead(teamId1: string, teamId2: string, limit: number = 10) {
    const key = cacheKey('teams', 'h2h', teamId1, teamId2, limit);
    const cached = await getCached(key);
    if (cached) return cached;

    const matches = await prisma.match.findMany({
      where: { OR: [{ homeTeamId: teamId1, awayTeamId: teamId2 }, { homeTeamId: teamId2, awayTeamId: teamId1 }], status: { in: ['FT', 'AET', 'PEN'] } },
      orderBy: { kickoffTime: 'desc' }, take: limit,
      include: { homeTeam: { select: { id: true, name: true, shortName: true, crestUrl: true } }, awayTeam: { select: { id: true, name: true, shortName: true, crestUrl: true } }, season: { select: { name: true, competition: { select: { name: true } } } } },
    });

    const h2h = { matches, summary: { total: matches.length, team1Wins: matches.filter(m => { const isTeam1Home = m.homeTeamId === teamId1; const team1Score = isTeam1Home ? m.homeScore : m.awayScore; const team2Score = isTeam1Home ? m.awayScore : m.homeScore; return team1Score !== null && team2Score !== null && team1Score > team2Score; }).length, team2Wins: matches.filter(m => { const isTeam1Home = m.homeTeamId === teamId1; const team1Score = isTeam1Home ? m.homeScore : m.awayScore; const team2Score = isTeam1Home ? m.awayScore : m.homeScore; return team1Score !== null && team2Score !== null && team1Score < team2Score; }).length, draws: matches.filter(m => { const isTeam1Home = m.homeTeamId === teamId1; const team1Score = isTeam1Home ? m.homeScore : m.awayScore; const team2Score = isTeam1Home ? m.awayScore : m.homeScore; return team1Score !== null && team2Score !== null && team1Score === team2Score; }).length } };

    await setCached(key, h2h, 600);
    return h2h;
  }
}