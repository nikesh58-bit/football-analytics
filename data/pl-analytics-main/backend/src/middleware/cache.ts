import { Request, Response, NextFunction } from 'express';
import { redis, cacheKey } from '../lib/redis';

export function cacheMiddleware(ttlSeconds: number = 300, keyPrefix: string = 'api') {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();

    const key = cacheKey(keyPrefix, req.originalUrl);
    let cached: string | null = null;
    try {
      cached = await redis.get(key);
    } catch {
      return next(); // Redis down: serve from source
    }

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      try {
        return res.json(JSON.parse(cached));
      } catch {
        // corrupted cache entry: fall through and re-fetch
      }
    }

    const originalJson = res.json.bind(res);
    res.json = (data: any) => {
      if (res.statusCode === 200) {
        redis.setex(key, ttlSeconds, JSON.stringify(data)).catch(() => {});
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
}

export function rateLimitMiddleware(maxRequests: number, windowMs: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = cacheKey('ratelimit', ip, req.path);
    
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.pexpire(key, windowMs);
    }

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current));
    res.setHeader('X-RateLimit-Reset', Date.now() + windowMs);

    if (current > maxRequests) {
      return res.status(429).json({
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please slow down.',
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    next();
  };
}