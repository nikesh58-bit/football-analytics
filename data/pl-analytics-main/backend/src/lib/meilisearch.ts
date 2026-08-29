import { MeiliSearch } from 'meilisearch';

const globalForMeili = globalThis as unknown as {
  meili: MeiliSearch | undefined;
};

export const meili =
  globalForMeili.meili ??
  new MeiliSearch({
    host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
    apiKey: process.env.MEILISEARCH_API_KEY,
  });

if (process.env.NODE_ENV !== 'production') globalForMeili.meili = meili;

export const INDEXES = {
  teams: 'teams',
  players: 'players',
  competitions: 'competitions',
  matches: 'matches',
} as const;

export async function setupIndexes() {
  const indexes = Object.values(INDEXES);
  
  for (const indexName of indexes) {
    try {
      await meili.getIndex(indexName);
    } catch {
      await meili.createIndex(indexName, { primaryKey: 'id' });
    }
  }

  await meili.index(INDEXES.teams).updateSearchableAttributes(['name', 'shortName', 'city', 'country']);
  await meili.index(INDEXES.teams).updateFilterableAttributes(['country', 'competitionIds']);
  
  await meili.index(INDEXES.players).updateSearchableAttributes(['displayName', 'firstName', 'lastName', 'nationality', 'position']);
  await meili.index(INDEXES.players).updateFilterableAttributes(['nationality', 'position', 'teamId', 'competitionIds']);

  await meili.index(INDEXES.competitions).updateSearchableAttributes(['name', 'shortName', 'country']);
  await meili.index(INDEXES.matches).updateSearchableAttributes(['homeTeamName', 'awayTeamName', 'competitionName']);
}

export async function indexTeam(team: any) {
  await meili.index(INDEXES.teams).addDocuments([{
    id: team.id,
    name: team.name,
    shortName: team.shortName,
    crestUrl: team.crestUrl,
    city: team.city,
    country: team.country,
    competitionIds: team.competitionIds || [],
  }]);
}

export async function indexPlayer(player: any) {
  await meili.index(INDEXES.players).addDocuments([{
    id: player.id,
    displayName: player.displayName,
    firstName: player.firstName,
    lastName: player.lastName,
    nationality: player.nationality,
    position: player.position,
    photoUrl: player.photoUrl,
    teamId: player.currentTeamId,
    teamName: player.currentTeam?.name,
    competitionIds: player.competitionIds || [],
  }]);
}

export async function searchTeams(query: string, options?: { limit?: number; filter?: string }) {
  return meili.index(INDEXES.teams).search(query, { limit: options?.limit || 10, filter: options?.filter });
}

export async function searchPlayers(query: string, options?: { limit?: number; filter?: string }) {
  return meili.index(INDEXES.players).search(query, { limit: options?.limit || 10, filter: options?.filter });
}

export async function searchAll(query: string, limit: number = 5) {
  const [teams, players, competitions] = await Promise.all([
    meili.index(INDEXES.teams).search(query, { limit }),
    meili.index(INDEXES.players).search(query, { limit }),
    meili.index(INDEXES.competitions).search(query, { limit }),
  ]);
  return { teams, players, competitions };
}