import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    enableReadyCheck: true,
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export async function connectRedis() {
  if (redis.status === 'wait') {
    await redis.connect();
  }
}

export function cacheKey(...parts: (string | number)[]): string {
  return `pl-analytics:${parts.join(':')}`;
}

// Cache helpers never throw: a Redis outage must degrade to DB-only, not 500 every request.
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function setCached<T>(key: string, data: T, ttlSeconds: number = 300): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
  } catch {
    // cache write failures are non-fatal
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  // SCAN instead of KEYS: KEYS blocks the Redis event loop on large datasets.
  let cursor = '0';
  try {
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  } catch {
    // non-fatal
  }
}
