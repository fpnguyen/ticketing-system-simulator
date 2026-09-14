import { Router, type Request, type Response } from 'express';
import { venueStore } from '../../state/venueStore.js';
import { manualAllocate, manualCancel } from '../../domain/allocationEngine.js';
import { manualAllocateSchema } from '../validation.js';

export const manualRouter = Router();

function requireVenue(req: Request, res: Response): boolean {
  if (!venueStore.venue || venueStore.venue.venueId !== req.params.venueId) {
    res.status(404).json({ error: 'Venue not found' });
    return false;
  }
  return true;
}

manualRouter.post('/:venueId/seats/:seatId/cancel', async (req, res) => {
  if (!requireVenue(req, res)) return;
  try {
    await manualCancel(req.params.seatId);
    res.json(venueStore.toSnapshot());
  } catch (err) {
    res.status(409).json({ error: err instanceof Error ? err.message : 'Cancel failed' });
  }
});

manualRouter.post('/:venueId/seats/:seatId/allocate', async (req, res) => {
  if (!requireVenue(req, res)) return;
  const parsed = manualAllocateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    const request = await manualAllocate(req.params.seatId, parsed.data.customer);
    res.json(request);
  } catch (err) {
    res.status(409).json({ error: err instanceof Error ? err.message : 'Allocate failed' });
  }
});
