import IORedis from 'ioredis';

// Dedicated BullMQ connection (must not share the cache client:
// BullMQ requires maxRetriesPerRequest: null).
export function createQueueConnection() {
  return new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}
