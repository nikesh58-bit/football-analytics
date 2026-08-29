import { z } from 'zod';

export const teamFiltersSchema = z.object({
  competitionId: z.string().optional(),
  country: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export const playerFiltersSchema = z.object({
  teamId: z.string().optional(),
  competitionId: z.string().optional(),
  seasonId: z.string().optional(),
  position: z.string().optional(),
  nationality: z.string().optional(),
  minMinutes: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['goals', 'assists', 'xG', 'xA', 'minutesPlayed', 'appearances']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const matchFiltersSchema = z.object({
  seasonId: z.string().optional(),
  competitionId: z.string().optional(),
  teamId: z.string().optional(),
  status: z.enum(['SCHEDULED', 'LIVE', 'HT', 'FT', 'AET', 'PEN', 'POSTPONED', 'CANCELLED']).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export const eventFiltersSchema = z.object({
  matchId: z.string().optional(),
  playerId: z.string().optional(),
  teamId: z.string().optional(),
  type: z.string().optional(),
  minuteFrom: z.coerce.number().min(0).optional(),
  minuteTo: z.coerce.number().max(120).optional(),
  limit: z.coerce.number().min(1).max(500).default(100),
  offset: z.coerce.number().min(0).default(0),
});

export const shotMapFiltersSchema = z.object({
  matchId: z.string().optional(),
  playerId: z.string().optional(),
  teamId: z.string().optional(),
  seasonId: z.string().optional(),
  competitionId: z.string().optional(),
  situation: z.enum(['OPEN_PLAY', 'SET_PIECE', 'PENALTY', 'COUNTER_ATTACK', 'FREE_KICK', 'CORNER', 'THROW_IN']).optional(),
  outcome: z.enum(['SUCCESS', 'FAIL']).optional(),
  bodyPart: z.enum(['FOOT', 'HEAD', 'OTHER']).optional(),
  limit: z.coerce.number().min(1).max(1000).default(500),
});

export function validateQuery<T extends z.ZodSchema>(schema: T) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid query parameters',
        details: result.error.flatten().fieldErrors,
      });
    }
    req.validatedQuery = result.data;
    next();
  };
}