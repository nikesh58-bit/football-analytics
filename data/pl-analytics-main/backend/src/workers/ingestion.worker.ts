import { Worker, Job } from 'bullmq';
import { createQueueConnection } from '../queues/connection';
import { prisma } from '../lib/prisma';

// Standalone worker: `npm run worker --workspace=backend`.
// Paginated/rate-limited Sportmonks fetchers belong in `ingestCompetition()`.
async function handleIngestCompetition(job: Job<{ optaCompetitionId: number }>) {
  const optaId = job.data.optaCompetitionId;
  if (!Number.isInteger(optaId) || optaId <= 0) throw new Error('invalid optaCompetitionId');
  await prisma.$connect();
  try {
    const competition = await prisma.competition.upsert({
      where: { optaId },
      create: { optaId, name: 'Premier League', shortName: 'PL', country: 'England', type: 'LEAGUE' },
      update: {},
    });
    await job.updateProgress(50);
    const teams = await prisma.team.count();
    await job.updateProgress(100);
    return { competitionId: competition.id, teams };
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

export const ingestionWorker = new Worker('ingestion', async (job) => {
  if (job.name === 'ingest-competition') return handleIngestCompetition(job as Job<{ optaCompetitionId: number }>);
  throw new Error(`unknown job ${job.name}`);
}, { connection: createQueueConnection(), concurrency: 2 });

ingestionWorker.on('failed', (job, err) => console.error(`ingest ${job?.id} failed:`, err.message));
ingestionWorker.on('completed', (job) => console.log(`ingest ${job.id} done`));

if (require.main === module) {
  console.log('ingestion worker running (queue: ingestion)');
}
