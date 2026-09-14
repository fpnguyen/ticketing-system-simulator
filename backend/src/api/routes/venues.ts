import { Router } from 'express';
import { venueStore } from '../../state/venueStore.js';
import { createVenue } from '../../domain/venueFactory.js';
import { eventBus } from '../../domain/eventBus.js';
import { resetVenueSeats, purgeVenueRequests } from '../../persistence/firestoreRepo.js';
import { createVenueSchema, resetVenueSchema } from '../validation.js';

export const venuesRouter = Router();

venuesRouter.post('/', (req, res) => {
  const parsed = createVenueSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const venue = createVenue(parsed.data);
  venueStore.reset(venue);
  eventBus.emit('venue:created', venue);
  res.status(201).json(venueStore.toSnapshot());
});

venuesRouter.get('/:venueId/snapshot', (req, res) => {
  if (!venueStore.venue || venueStore.venue.venueId !== req.params.venueId) {
    return res.status(404).json({ error: 'Venue not found' });
  }
  res.json(venueStore.toSnapshot());
});

venuesRouter.post('/:venueId/reset', async (req, res) => {
  if (!venueStore.venue || venueStore.venue.venueId !== req.params.venueId) {
    return res.status(404).json({ error: 'Venue not found' });
  }
  const parsed = resetVenueSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  if (venueStore.queuedCount > 0 || venueStore.processingCount > 0) {
    return res.status(409).json({ error: 'Cannot reset while a simulation is in progress' });
  }
  const venue = venueStore.venue;
  venueStore.resetSeatsInPlace();
  eventBus.emit('venue:reset');
  void resetVenueSeats(venue);
  if (parsed.data.purgeHistory) {
    void purgeVenueRequests(venue.venueId);
  }
  res.json(venueStore.toSnapshot());
});
