import { Queue } from 'bullmq';
import { createQueueConnection } from './connection';

const globalForQueue = globalThis as unknown as { ingestionQueue?: Queue };

export const ingestionQueue =
  globalForQueue.ingestionQueue ??
  new Queue('ingestion', {
    connection: createQueueConnection(),
    defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: 100, removeOnFail: 500 },
  });

if (process.env.NODE_ENV !== 'production') globalForQueue.ingestionQueue = ingestionQueue;

export function enqueueCompetitionIngest(optaCompetitionId: number) {
  if (!Number.isInteger(optaCompetitionId) || optaCompetitionId <= 0) {
    throw new Error('optaCompetitionId must be a positive integer');
  }
  return ingestionQueue.add('ingest-competition', { optaCompetitionId }, { jobId: `ingest-${optaCompetitionId}-${Date.now()}` });
}
