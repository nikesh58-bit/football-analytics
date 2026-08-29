export interface Team {
  id: string;
  optaId: number;
  name: string;
  shortName: string;
  crestUrl: string;
  founded: number | null;
  stadium: string | null;
  stadiumCapacity: number | null;
  city: string | null;
  country: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  id: string;
  optaId: number;
  firstName: string;
  lastName: string;
  displayName: string;
  dateOfBirth: Date | null;
  nationality: string | null;
  height: number | null;
  weight: number | null;
  preferredFoot: 'LEFT' | 'RIGHT' | 'BOTH' | null;
  position: string | null;
  photoUrl: string | null;
  currentTeamId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Competition {
  id: string;
  optaId: number;
  name: string;
  shortName: string;
  country: string;
  logoUrl: string | null;
  type: 'LEAGUE' | 'CUP' | 'INTERNATIONAL';
  createdAt: Date;
  updatedAt: Date;
}

export interface Season {
  id: string;
  competitionId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  optaId: number;
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'SCHEDULED' | 'LIVE' | 'HT' | 'FT' | 'AET' | 'PEN' | 'POSTPONED' | 'CANCELLED';
  matchday: number | null;
  kickoffTime: Date;
  venue: string | null;
  referee: string | null;
  attendance: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  playerId: string | null;
  teamId: string;
  type: 'GOAL' | 'ASSIST' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION_IN' | 'SUBSTITUTION_OUT' | 'SHOT' | 'SHOT_ON_TARGET' | 'SHOT_OFF_TARGET' | 'BLOCKED_SHOT' | 'PENALTY' | 'PENALTY_MISSED' | 'OWN_GOAL' | 'FOUL' | 'OFFSIDE' | 'CORNER' | 'FREE_KICK' | 'THROW_IN' | 'SAVE' | 'CLAIM' | 'PUNCH' | 'INTERCEPTION' | 'TACKLE' | 'CLEARANCE' | 'DRIBBLE' | 'PASS' | 'KEY_PASS' | 'CROSS' | 'LONG_BALL' | 'THROUGH_BALL';
  minute: number;
  second: number;
  x: number | null;
  y: number | null;
  endX: number | null;
  endY: number | null;
  bodyPart: 'FOOT' | 'HEAD' | 'OTHER' | null;
  situation: 'OPEN_PLAY' | 'SET_PIECE' | 'PENALTY' | 'COUNTER_ATTACK' | 'FREE_KICK' | 'CORNER' | 'THROW_IN' | null;
  outcome: 'SUCCESS' | 'FAIL' | null;
  relatedPlayerId: string | null;
  createdAt: Date;
}

export interface PlayerSeasonStats {
  id: string;
  playerId: string;
  teamId: string;
  seasonId: string;
  competitionId: string;
  appearances: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  xG: number;
  xA: number;
  shots: number;
  shotsOnTarget: number;
  passes: number;
  passAccuracy: number;
  keyPasses: number;
  crosses: number;
  crossesAccuracy: number;
  dribbles: number;
  dribblesWon: number;
  tackles: number;
  tacklesWon: number;
  interceptions: number;
  clearances: number;
  blocks: number;
  fouls: number;
  foulsDrawn: number;
  offsides: number;
  yellowCards: number;
  redCards: number;
  penaltiesScored: number;
  penaltiesMissed: number;
  penaltiesWon: number;
  penaltiesConceded: number;
  ownGoals: number;
  cleanSheets: number;
  saves: number;
  goalsConceded: number;
  punches: number;
  claims: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamSeasonStats {
  id: string;
  teamId: string;
  seasonId: string;
  competitionId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  xGFor: number;
  xGAgainst: number;
  cleanSheets: number;
  failedToScore: number;
  homePlayed: number;
  homeWon: number;
  homeDrawn: number;
  homeLost: number;
  homeGoalsFor: number;
  homeGoalsAgainst: number;
  awayPlayed: number;
  awayWon: number;
  awayDrawn: number;
  awayLost: number;
  awayGoalsFor: number;
  awayGoalsAgainst: number;
  form: string;
  position: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Standing {
  id: string;
  seasonId: string;
  teamId: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string;
  updatedAt: Date;
}

export interface SearchResult {
  type: 'team' | 'player' | 'competition' | 'match';
  id: string;
  name: string;
  subtitle: string;
  imageUrl: string | null;
  url: string;
}

export type TimeRange = 'last5' | 'last10' | 'season' | 'home' | 'away';

export interface FilterParams {
  seasonId?: string;
  competitionId?: string;
  teamId?: string;
  playerId?: string;
  timeRange?: TimeRange;
  position?: string;
  minMinutes?: number;
  limit?: number;
  offset?: number;
  // match filters
  status?: string;
  fromDate?: string;
  toDate?: string;
  // event filters
  type?: string;
  minuteFrom?: number;
  minuteTo?: number;
  situation?: string;
  outcome?: string;
  bodyPart?: string;
  // misc
  search?: string;
  nationality?: string;
  country?: string;
  matchId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}