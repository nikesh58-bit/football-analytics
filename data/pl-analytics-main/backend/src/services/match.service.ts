import { prisma } from '../lib/prisma';
import { cacheKey, getCached, setCached } from '../lib/redis';
import { PaginatedResponse, FilterParams } from '@pl-analytics/shared';

export class MatchService {
  static async getAll(params: FilterParams = {}): Promise<PaginatedResponse<any>> {
    const key = cacheKey('matches', 'list', JSON.stringify(params));
    const cached = await getCached<PaginatedResponse<any>>(key);
    if (cached) return cached;

    const { seasonId, competitionId, teamId, status, fromDate, toDate, limit = 20, offset = 0 } = params;

    const where: any = {};
    if (seasonId) where.seasonId = seasonId;
    if (competitionId) where.season = { competitionId };
    if (teamId) where.OR = [{ homeTeamId: teamId }, { awayTeamId: teamId }];
    if (status) where.status = status;
    if (fromDate || toDate) { where.kickoffTime = {}; if (fromDate) where.kickoffTime.gte = new Date(fromDate); if (toDate) where.kickoffTime.lte = new Date(toDate); }

    const [data, total] = await Promise.all([
      prisma.match.findMany({ where, take: limit, skip: offset, orderBy: { kickoffTime: 'desc' }, include: { homeTeam: { select: { id: true, name: true, shortName: true, crestUrl: true } }, awayTeam: { select: { id: true, name: true, shortName: true, crestUrl: true } }, season: { select: { id: true, name: true, competition: { select: { name: true, shortName: true } } } } } }),
      prisma.match.count({ where }),
    ]);

    const result = { data, total, page: Math.floor(offset / limit) + 1, pageSize: limit, totalPages: Math.ceil(total / limit) };
    await setCached(key, result, 60);
    return result;
  }

  static async getById(id: string) {
    const key = cacheKey('matches', 'detail', id);
    const cached = await getCached(key);
    if (cached) return cached;

    const match = await prisma.match.findUnique({
      where: { id },
      include: { homeTeam: true, awayTeam: true, season: { include: { competition: true } }, events: { include: { player: { select: { id: true, displayName: true, photoUrl: true } } }, orderBy: [{ minute: 'asc' }, { second: 'asc' }] } },
    });

    if (match) await setCached(key, match, match.status === 'LIVE' ? 10 : 300);
    return match;
  }

  static async getLiveMatches() {
    const key = cacheKey('matches', 'live');
    const cached = await getCached(key);
    if (cached) return cached;

    const matches = await prisma.match.findMany({
      where: { status: { in: ['LIVE', 'HT'] } },
      include: { homeTeam: { select: { id: true, name: true, shortName: true, crestUrl: true } }, awayTeam: { select: { id: true, name: true, shortName: true, crestUrl: true } }, season: { select: { name: true, competition: { select: { name: true, shortName: true } } } }, events: { where: { type: { in: ['GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION_IN', 'SUBSTITUTION_OUT'] } }, include: { player: { select: { id: true, displayName: true } } }, orderBy: [{ minute: 'desc' }, { second: 'desc' }], take: 10 } },
    });

    await setCached(key, matches, 15);
    return matches;
  }

  static async getUpcomingMatches(limit: number = 10) {
    const key = cacheKey('matches', 'upcoming', limit);
    const cached = await getCached(key);
    if (cached) return cached;

    const matches = await prisma.match.findMany({
      where: { status: 'SCHEDULED', kickoffTime: { gte: new Date() } },
      orderBy: { kickoffTime: 'asc' }, take: limit,
      include: { homeTeam: { select: { id: true, name: true, shortName: true, crestUrl: true } }, awayTeam: { select: { id: true, name: true, shortName: true, crestUrl: true } }, season: { select: { name: true, competition: { select: { name: true, shortName: true } } } } },
    });

    await setCached(key, matches, 300);
    return matches;
  }

  static async getMatchEvents(matchId: string, params: FilterParams = {}) {
    const key = cacheKey('matches', 'events', matchId, JSON.stringify(params));
    const cached = await getCached(key);
    if (cached) return cached;

    const { type, minuteFrom, minuteTo, limit = 100, offset = 0 } = params;
    const where: any = { matchId };
    if (type) where.type = type;
    if (minuteFrom !== undefined || minuteTo !== undefined) { where.minute = {}; if (minuteFrom !== undefined) where.minute.gte = minuteFrom; if (minuteTo !== undefined) where.minute.lte = minuteTo; }

    const events = await prisma.matchEvent.findMany({ where, take: limit, skip: offset, orderBy: [{ minute: 'asc' }, { second: 'asc' }], include: { player: { select: { id: true, displayName: true, photoUrl: true } }, relatedPlayer: { select: { id: true, displayName: true } } } });
    await setCached(key, events, 60);
    return events;
  }
}