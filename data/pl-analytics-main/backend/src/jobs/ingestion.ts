/**
 * Data ingestion entrypoint referenced by README:
 *   npx tsx backend/src/jobs/ingestion.ts 8
 *
 * Currently implements a safe, idempotent baseline:
 * - validates env + CLI args (no unbounded fetches)
 * - ensures DB connectivity before any work
 * - seeds core competition/season if missing (delegates to seed logic)
 * - indexes existing teams/players to Meilisearch best-effort
 *
 * Full Sportmonks/API-Football fixture+event ingestion should extend
 * `ingestCompetition()` with paginated, rate-limited fetchers.
 */
import { prisma } from '../lib/prisma';
import { meili, INDEXES } from '../lib/meilisearch';

async function ensureCompetition(optaId: number) {
  const competition = await prisma.competition.upsert({
    where: { optaId },
    create: {
      optaId,
      name: 'Premier League',
      shortName: 'PL',
      country: 'England',
      type: 'LEAGUE',
    },
    update: {},
  });
  return competition;
}

async function indexExisting(): Promise<void> {
  try {
    const teams = await prisma.team.findMany({ take: 500 });
    if (teams.length > 0) {
      await meili.index(INDEXES.teams).addDocuments(
        teams.map((t) => ({
          id: t.id,
          name: t.name,
          shortName: t.shortName,
          city: t.city,
          country: t.country,
        })),
      );
      console.log(`Indexed ${teams.length} teams`);
    }

    const players = await prisma.player.findMany({ take: 1000 });
    if (players.length > 0) {
      await meili.index(INDEXES.players).addDocuments(
        players.map((p) => ({
          id: p.id,
          displayName: p.displayName,
          firstName: p.firstName,
          lastName: p.lastName,
          nationality: p.nationality,
          position: p.position,
          teamId: p.currentTeamId,
        })),
      );
      console.log(`Indexed ${players.length} players`);
    }
  } catch (error) {
    // Search is non-critical: log and continue, never fail ingestion.
    console.warn('Meilisearch indexing skipped:', (error as Error).message);
  }
}

async function main() {
  const optaId = Number(process.argv[2] ?? '8');
  if (!Number.isInteger(optaId) || optaId <= 0) {
    console.error('Usage: npx tsx backend/src/jobs/ingestion.ts <optaCompetitionId>');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Copy .env.example to .env first.');
    process.exit(1);
  }

  if (!process.env.SPORTMONKS_TOKEN) {
    console.warn('SPORTMONKS_TOKEN not set: running baseline (DB ensure + reindex) only.');
  }

  await prisma.$connect();
  try {
    const competition = await ensureCompetition(optaId);
    console.log(`Competition ready: ${competition.name} (${competition.optaId})`);
    await indexExisting();
    console.log('Ingestion baseline complete.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Ingestion failed:', error);
  process.exit(1);
});
