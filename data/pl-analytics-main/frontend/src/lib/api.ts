const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_KEY_STORAGE_KEY = 'pl-analytics-api-key';

function loadStoredApiKey(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage.getItem(API_KEY_STORAGE_KEY) || undefined;
  } catch {
    return undefined;
  }
}

type QueryParams = Record<string, string | undefined>;

function toQueryString(params?: QueryParams): string {
  if (!params) return '';
  return new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '') as [string, string][],
  ).toString();
}

class ApiClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = ApiClient.normalizeBaseUrl(baseUrl);
    this.apiKey = loadStoredApiKey();
  }

  private static normalizeBaseUrl(url: string): string {
    let out = (url || '').trim().replace(/\/+$/, '');
    // Render `host` property yields a bare hostname; fetch needs a scheme.
    if (out && !/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(out)) out = `https://${out}`;
    return out || 'http://localhost:3001';
  }

  setApiKey(key: string) {
    this.apiKey = key;
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(API_KEY_STORAGE_KEY, key);
    } catch {
      // storage unavailable (private mode): keep in-memory only
    }
  }

  clearApiKey() {
    this.apiKey = undefined;
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem(API_KEY_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  getApiKey(): string | undefined {
    if (!this.apiKey) this.apiKey = loadStoredApiKey();
    return this.apiKey;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    const key = this.getApiKey();
    if (key) headers['Authorization'] = `Bearer ${key}`;

    // NOTE: Next.js `next.revalidate` only applies to server-side fetch.
    // Client-side SWR calls must not use it, so we do a plain fetch here.
    const response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json();
  }

  getTeams(params?: QueryParams) {
    const search = toQueryString(params);
    return this.request<{ data: any[]; total: number }>(`/api/teams${search ? `?${search}` : ''}`);
  }

  getTeam(id: string) {
    return this.request<any>(`/api/teams/${encodeURIComponent(id)}`);
  }

  getTeamForm(id: string, limit: number = 5) {
    return this.request<any>(`/api/teams/${encodeURIComponent(id)}/form?limit=${limit}`);
  }

  getTeamSeasonStats(teamId: string, seasonId: string) {
    return this.request<any>(`/api/teams/${encodeURIComponent(teamId)}/season-stats?seasonId=${encodeURIComponent(seasonId)}`);
  }

  getHeadToHead(teamId1: string, teamId2: string, limit: number = 10) {
    return this.request<any>(`/api/teams/${encodeURIComponent(teamId1)}/h2h/${encodeURIComponent(teamId2)}?limit=${limit}`);
  }

  getPlayers(params?: QueryParams) {
    const search = toQueryString(params);
    return this.request<{ data: any[]; total: number }>(`/api/players${search ? `?${search}` : ''}`);
  }

  getPlayer(id: string) {
    return this.request<any>(`/api/players/${encodeURIComponent(id)}`);
  }

  getPlayerSeasonStats(playerId: string, seasonId: string, competitionId?: string) {
    const search = new URLSearchParams({ seasonId, ...(competitionId && { competitionId }) }).toString();
    return this.request<any>(`/api/players/${encodeURIComponent(playerId)}/season-stats?${search}`);
  }

  getPlayerCareer(playerId: string) {
    return this.request<any>(`/api/players/${encodeURIComponent(playerId)}/career`);
  }

  comparePlayers(playerIds: string[], seasonId?: string, competitionId?: string) {
    const search = new URLSearchParams({
      ids: playerIds.join(','),
      ...(seasonId && { seasonId }),
      ...(competitionId && { competitionId }),
    }).toString();
    return this.request<any>(`/api/players/compare?${search}`);
  }

  getTopPerformers(metric: string, params?: QueryParams) {
    const search = toQueryString(params);
    return this.request<any[]>(`/api/players/top/${encodeURIComponent(metric)}${search ? `?${search}` : ''}`);
  }

  getMatches(params?: QueryParams) {
    const search = toQueryString(params);
    return this.request<{ data: any[]; total: number }>(`/api/matches${search ? `?${search}` : ''}`);
  }

  getLiveMatches() {
    return this.request<any[]>(`/api/matches/live`);
  }

  getUpcomingMatches(limit: number = 10) {
    return this.request<any[]>(`/api/matches/upcoming?limit=${limit}`);
  }

  getMatch(id: string) {
    return this.request<any>(`/api/matches/${encodeURIComponent(id)}`);
  }

  getMatchEvents(matchId: string, params?: QueryParams) {
    const search = toQueryString(params);
    return this.request<any[]>(`/api/matches/${encodeURIComponent(matchId)}/events${search ? `?${search}` : ''}`);
  }

  getShots(params?: QueryParams) {
    const search = toQueryString(params);
    return this.request<any[]>(`/api/events/shots${search ? `?${search}` : ''}`);
  }

  getHeatmap(playerId: string, seasonId?: string, competitionId?: string) {
    const search = new URLSearchParams({
      ...(seasonId && { seasonId }),
      ...(competitionId && { competitionId }),
    }).toString();
    return this.request<any>(`/api/events/heatmap/${encodeURIComponent(playerId)}${search ? `?${search}` : ''}`);
  }

  getLeagueTable(seasonId: string) {
    return this.request<any[]>(`/api/analytics/table/${encodeURIComponent(seasonId)}`);
  }

  getTopScorers(seasonId: string, competitionId?: string, limit: number = 20) {
    const search = new URLSearchParams({
      ...(competitionId && { competitionId }),
      limit: limit.toString(),
    }).toString();
    return this.request<any[]>(`/api/analytics/top-scorers/${encodeURIComponent(seasonId)}?${search}`);
  }

  getTopAssists(seasonId: string, competitionId?: string, limit: number = 20) {
    const search = new URLSearchParams({
      ...(competitionId && { competitionId }),
      limit: limit.toString(),
    }).toString();
    return this.request<any[]>(`/api/analytics/top-assists/${encodeURIComponent(seasonId)}?${search}`);
  }

  getPlayerRadar(playerId: string, seasonId: string, competitionId?: string) {
    const search = new URLSearchParams({ seasonId, ...(competitionId && { competitionId }) }).toString();
    return this.request<any[]>(`/api/analytics/radar/${encodeURIComponent(playerId)}?${search}`);
  }

  searchAll(query: string, limit: number = 5) {
    return this.request<any>(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }
}

export const api = new ApiClient();
export const fetcher = <T>(url: string) => api.request<T>(url);
