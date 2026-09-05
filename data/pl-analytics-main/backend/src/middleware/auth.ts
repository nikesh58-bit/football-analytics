import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

export interface AuthenticatedRequest extends Request {
  apiKey?: {
    id: string;
    tier: 'FREE' | 'PRO' | 'ENTERPRISE';
    rateLimit: number;
  };
  validatedQuery?: Record<string, any>;
}

export const TIER_LIMITS = {
  FREE: 100,
  PRO: 1000,
  ENTERPRISE: 10000,
} as const;

export async function apiKeyAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      code: 'UNAUTHORIZED', 
      message: 'API key required. Format: Authorization: Bearer <key>' 
    });
  }

  const providedKey = authHeader.slice(7);
  const keyHash = crypto.createHash('sha256').update(providedKey).digest('hex');

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
  });

  if (!apiKey || !apiKey.isActive) {
    return res.status(401).json({ 
      code: 'INVALID_KEY', 
      message: 'Invalid or revoked API key' 
    });
  }

  // Fire-and-forget: never block or fail a request on lastUsedAt bookkeeping
  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  req.apiKey = {
    id: apiKey.id,
    tier: apiKey.tier,
    rateLimit: apiKey.rateLimit,
  };

  next();
}

export function tierLimit(...allowedTiers: ('FREE' | 'PRO' | 'ENTERPRISE')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    }
    
    if (!allowedTiers.includes(req.apiKey.tier)) {
      return res.status(403).json({ 
        code: 'FORBIDDEN', 
        message: `This endpoint requires ${allowedTiers.join(' or ')} tier` 
      });
    }
    
    next();
  };
}

export function optionalApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  apiKeyAuth(req, res, next);
}