import { eventBus } from '../domain/eventBus.js';
import { venueStore } from '../state/venueStore.js';
import { persistRequestUpdate, persistSeatUpdate, persistVenueCreated } from './firestoreRepo.js';

/** Bridges engine events to Firestore writes, fire-and-forget so persistence
 * latency never gates the worker loop's next dequeue. */
export function wireFirestorePersistence(): void {
  eventBus.on('venue:created', (venue) => {
    void persistVenueCreated(venue);
  });

  eventBus.on('seat:update', (seat) => {
    const venue = venueStore.venue;
    if (!venue) return;
    void persistSeatUpdate(venue.venueId, seat);
  });

  eventBus.on('request:update', (request) => {
    void persistRequestUpdate(request);
  });
}
