import { describe, expect, it, beforeEach } from 'vitest';
import { venueStore } from '../src/state/venueStore.js';
import { createVenue } from '../src/domain/venueFactory.js';
import { attemptAllocate, createRequestItem, processingDelay } from '../src/domain/allocationEngine.js';

describe('concurrency correctness', () => {
  beforeEach(() => {
    venueStore.reset(createVenue({ rows: 1, columns: 1 }));
    processingDelay.minMs = 0;
    processingDelay.maxMs = 5;
  });

  it('allows exactly one winner when many requests race for the same seat', async () => {
    const venue = venueStore.requireVenue();
    const seatId = [...venue.seats.keys()][0];

    const requests = Array.from({ length: 50 }, () =>
      createRequestItem({ venueId: venue.venueId, seatId, runId: null, source: 'simulation' }),
    );

    const results = await Promise.all(requests.map((r) => attemptAllocate(r)));

    const committed = results.filter((r) => r.status === 'committed');
    const failed = results.filter((r) => r.status === 'failed');

    expect(committed).toHaveLength(1);
    expect(failed).toHaveLength(49);
    expect(failed.every((r) => r.failureReason === 'seat_unavailable')).toBe(true);

    const seat = venueStore.getSeat(seatId);
    expect(seat.status).toBe('sold');
    expect(seat.requestId).toBe(committed[0].requestId);
    expect(seat.ticketId).toBe(committed[0].ticketId);
  });

  it('lets a freed seat be won exactly once when raced again after cancellation', async () => {
    const venue = venueStore.requireVenue();
    const seatId = [...venue.seats.keys()][0];

    const first = createRequestItem({ venueId: venue.venueId, seatId, runId: null, source: 'simulation' });
    await attemptAllocate(first);
    expect(venueStore.getSeat(seatId).status).toBe('sold');

    const { manualCancel } = await import('../src/domain/allocationEngine.js');
    await manualCancel(seatId);
    expect(venueStore.getSeat(seatId).status).toBe('available');

    const rematch = Array.from({ length: 20 }, () =>
      createRequestItem({ venueId: venue.venueId, seatId, runId: null, source: 'simulation' }),
    );
    const results = await Promise.all(rematch.map((r) => attemptAllocate(r)));
    expect(results.filter((r) => r.status === 'committed')).toHaveLength(1);
  });
});
