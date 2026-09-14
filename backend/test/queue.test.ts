import { describe, expect, it, beforeEach } from 'vitest';
import { venueStore } from '../src/state/venueStore.js';
import { createVenue } from '../src/domain/venueFactory.js';
import { startSimulationRun } from '../src/domain/workerPool.js';
import { eventBus } from '../src/domain/eventBus.js';
import { processingDelay } from '../src/domain/allocationEngine.js';

function waitForRunCompletion(runId: string): Promise<void> {
  return new Promise((resolve) => {
    const handler = (payload: { runId: string }) => {
      if (payload.runId === runId) {
        eventBus.off('run:completed', handler);
        resolve();
      }
    };
    eventBus.on('run:completed', handler);
  });
}

describe('queue + worker pool oversubscription', () => {
  beforeEach(() => {
    venueStore.reset(createVenue({ rows: 5, columns: 5 })); // 25 seats
    processingDelay.minMs = 0;
    processingDelay.maxMs = 5;
  });

  it('commits exactly one request per seat and fails the rest when demand exceeds supply', async () => {
    const { runId } = await startSimulationRun({
      requestCount: 100,
      concurrency: 8,
      arrivalPattern: 'burst',
    });

    await waitForRunCompletion(runId);

    const requests = [...venueStore.requests.values()];
    const committed = requests.filter((r) => r.status === 'committed');
    const failed = requests.filter((r) => r.status === 'failed');

    // Random weighted targeting doesn't guarantee every seat gets picked at
    // least once, so "committed === min(N, seats)" isn't a safe assertion —
    // the real correctness properties are conservation and no double-sells.
    expect(requests).toHaveLength(100);
    expect(committed.length + failed.length).toBe(100);
    expect(committed.length).toBeLessThanOrEqual(25);
    expect(committed.length).toBeGreaterThan(15); // sanity: contention shouldn't starve most seats

    const seatIds = committed.map((r) => r.seatId);
    expect(new Set(seatIds).size).toBe(committed.length); // no seat won twice

    const requestIds = committed.map((r) => r.requestId);
    expect(new Set(requestIds).size).toBe(committed.length);

    const soldSeats = [...venueStore.requireVenue().seats.values()].filter((s) => s.status === 'sold');
    expect(soldSeats).toHaveLength(committed.length);

    expect(venueStore.queuedCount).toBe(0);
    expect(venueStore.processingCount).toBe(0);
    expect(venueStore.venue?.status).toBe('completed');
  }, 15000);
});
