import { Router } from 'express';
import teamsRouter from './teams';
import playersRouter from './players';
import matchesRouter from './matches';
import eventsRouter from './events';
import analyticsRouter from './analytics';
import searchRouter from './search';
import billingRouter from './billing';
import jobsRouter from './jobs';

// Canonical versioned surface. Mounted at /api/v1.
// Legacy /api/* mounts remain in index.ts for compatibility.
const v1 = Router();

v1.use('/teams', teamsRouter);
v1.use('/players', playersRouter);
v1.use('/matches', matchesRouter);
v1.use('/events', eventsRouter);
v1.use('/analytics', analyticsRouter);
v1.use('/search', searchRouter);
v1.use('/billing', billingRouter);
v1.use('/jobs', jobsRouter);

export default v1;
