import { Router } from 'express';
import { venueStore } from '../../state/venueStore.js';
import { startSimulationRun } from '../../domain/workerPool.js';
import { simulateSchema } from '../validation.js';

export const simulationRouter = Router();

simulationRouter.post('/:venueId/simulate', async (req, res) => {
  if (!venueStore.venue || venueStore.venue.venueId !== req.params.venueId) {
    return res.status(404).json({ error: 'Venue not found' });
  }
  const parsed = simulateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { runId } = await startSimulationRun(parsed.data);
  res.status(202).json({ runId, accepted: true });
});
