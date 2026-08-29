import useSWR from 'swr';
import { api, fetcher } from '@/lib/api';

type Q = Record<string, string | undefined>;
const swrFetcher = fetcher as any;
const toQS = (params?: Q) => new URLSearchParams(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== '') as [string, string][]).toString();

export function useTeams(params?: Q) { const key = `/api/teams${params && toQS(params) ? '?' + toQS(params) : ''}`; return useSWR<any>(key, swrFetcher, { revalidateOnFocus: false, dedupingInterval: 30000 }); }
export function useTeam(id: string) { return useSWR<any>(id ? `/api/teams/${id}` : null, swrFetcher, { revalidateOnFocus: false }); }
export function useTeamForm(id: string, limit: number = 5) { return useSWR<any>(id ? `/api/teams/${id}/form?limit=${limit}` : null, swrFetcher, { revalidateOnFocus: false }); }
export function usePlayers(params?: Q) { const key = `/api/players${params && toQS(params) ? '?' + toQS(params) : ''}`; return useSWR<any>(key, swrFetcher, { revalidateOnFocus: false, dedupingInterval: 30000 }); }
export function usePlayer(id: string) { return useSWR<any>(id ? `/api/players/${id}` : null, swrFetcher, { revalidateOnFocus: false }); }
export function usePlayerSeasonStats(playerId: string, seasonId: string, competitionId?: string) { const key = playerId && seasonId ? `/api/players/${playerId}/season-stats?seasonId=${seasonId}${competitionId ? `&competitionId=${competitionId}` : ''}` : null; return useSWR<any>(key, swrFetcher, { revalidateOnFocus: false }); }
export function usePlayerCareer(playerId: string) { return useSWR<any>(playerId ? `/api/players/${playerId}/career` : null, swrFetcher, { revalidateOnFocus: false }); }
export function useTopPerformers(metric: string, params?: Q) { const key = `/api/players/top/${metric}${params && toQS(params) ? '?' + toQS(params) : ''}`; return useSWR<any>(key, swrFetcher, { revalidateOnFocus: false }); }
export function useMatches(params?: Q) { const key = `/api/matches${params && toQS(params) ? '?' + toQS(params) : ''}`; return useSWR<any>(key, swrFetcher, { revalidateOnFocus: false, refreshInterval: 30000 }); }
export function useLiveMatches() { return useSWR<any>('/api/matches/live', swrFetcher, { revalidateOnFocus: false, refreshInterval: 15000 }); }
export function useUpcomingMatches(limit: number = 10) { return useSWR<any>(`/api/matches/upcoming?limit=${limit}`, swrFetcher, { revalidateOnFocus: false, refreshInterval: 60000 }); }
export function useMatch(id: string) { return useSWR<any>(id ? `/api/matches/${id}` : null, swrFetcher, { revalidateOnFocus: false, refreshInterval: (data: any) => data?.status === 'LIVE' ? 10000 : 0 }); }
export function useShots(params?: Q) { const key = `/api/events/shots${params && toQS(params) ? '?' + toQS(params) : ''}`; return useSWR<any>(key, swrFetcher, { revalidateOnFocus: false }); }
export function useHeatmap(playerId: string, seasonId?: string, competitionId?: string) { const key = playerId ? `/api/events/heatmap/${playerId}?seasonId=${seasonId || ''}${competitionId ? `&competitionId=${competitionId}` : ''}` : null; return useSWR<any>(key, swrFetcher, { revalidateOnFocus: false }); }
export function useLeagueTable(seasonId: string) { return useSWR<any>(seasonId ? `/api/analytics/table/${seasonId}` : null, swrFetcher, { revalidateOnFocus: false }); }
export function useTopScorers(seasonId: string, competitionId?: string, limit: number = 20) { const key = seasonId ? `/api/analytics/top-scorers/${seasonId}?${new URLSearchParams({ competitionId: competitionId || '', limit: limit.toString() }).toString()}` : null; return useSWR<any>(key, swrFetcher, { revalidateOnFocus: false }); }
export function useTopAssists(seasonId: string, competitionId?: string, limit: number = 20) { const key = seasonId ? `/api/analytics/top-assists/${seasonId}?${new URLSearchParams({ competitionId: competitionId || '', limit: limit.toString() }).toString()}` : null; return useSWR<any>(key, swrFetcher, { revalidateOnFocus: false }); }
export function usePlayerRadar(playerId: string, seasonId: string, competitionId?: string) { const key = playerId && seasonId ? `/api/analytics/radar/${playerId}?seasonId=${seasonId}${competitionId ? `&competitionId=${competitionId}` : ''}` : null; return useSWR<any>(key, swrFetcher, { revalidateOnFocus: false }); }
export function useSearch(query: string, limit: number = 5) { const key = query && query.length >= 2 ? `/api/search?q=${encodeURIComponent(query)}&limit=${limit}` : null; return useSWR<any>(key, swrFetcher, { revalidateOnFocus: false, dedupingInterval: 5000 }); }