import { Router } from 'express';
import { venuesRouter } from './routes/venues.js';
import { simulationRouter } from './routes/simulation.js';
import { manualRouter } from './routes/manual.js';

export const apiRouter = Router();

apiRouter.use('/venues', venuesRouter);
apiRouter.use('/venues', simulationRouter);
apiRouter.use('/venues', manualRouter);
