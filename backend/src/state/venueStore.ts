import type { RequestItem, RequestStatus, SeatState, VenueState, WorkerState } from '../domain/types.js';
import { AsyncQueue } from '../domain/asyncQueue.js';
import { ThroughputTracker } from '../domain/metrics.js';

/** Single in-memory source of truth for the currently active venue.
 * Exactly one instance of this process may run at once (see plan's
 * deployment constraint) — this store is not a cache, it's authoritative. */
class VenueStore {
  venue: VenueState | null = null;
  requests = new Map<string, RequestItem>();
  queue = new AsyncQueue<RequestItem>();
  workers: WorkerState[] = [];
  throughput = new ThroughputTracker();
  activeRunId: string | null = null;
  queuedCount = 0;
  processingCount = 0;

  /** Full replacement — only for brand-new venue creation. Any worker loops
   * from a prior venue are abandoned (they'll sit blocked on the old, now
   * dead, queue forever) since starting a new venue is a rare, deliberate
   * action, not something that needs a clean-teardown path. */
  reset(venue: VenueState): void {
    this.venue = venue;
    this.requests.clear();
    this.queue = new AsyncQueue<RequestItem>();
    this.workers = [];
    this.throughput = new ThroughputTracker();
    this.activeRunId = null;
    this.queuedCount = 0;
    this.processingCount = 0;
  }

  /** In-place reset for the "Reset" action: seats/requests/metrics clear but
   * the queue and worker loops keep running against the same queue instance,
   * so already-blocked `queue.take()` calls stay valid. Caller must ensure no
   * run is in flight (queuedCount === 0 && processingCount === 0) first. */
  resetSeatsInPlace(): void {
    const venue = this.requireVenue();
    for (const seat of venue.seats.values()) {
      seat.status = 'available';
      seat.requestId = null;
      seat.ticketId = null;
      seat.isHot = false;
    }
    venue.status = 'idle';
    this.requests.clear();
    this.throughput = new ThroughputTracker();
    this.activeRunId = null;
  }

  requireVenue(): VenueState {
    if (!this.venue) throw new Error('No venue has been created yet');
    return this.venue;
  }

  getSeat(seatId: string): SeatState {
    const seat = this.requireVenue().seats.get(seatId);
    if (!seat) throw new Error(`Unknown seat: ${seatId}`);
    return seat;
  }

  countByStatus(status: RequestStatus): number {
    let count = 0;
    for (const r of this.requests.values()) if (r.status === status) count++;
    return count;
  }

  /** Full current state, used both for the REST snapshot endpoint and the
   * socket `venue:snapshot` reply on (re)join — the single resync mechanism
   * for clients that missed incremental events. */
  toSnapshot() {
    const venue = this.requireVenue();
    return {
      venue: {
        venueId: venue.venueId,
        name: venue.name,
        rows: venue.rows,
        columns: venue.columns,
        status: venue.status,
      },
      seats: [...venue.seats.values()],
      queuedCount: this.queuedCount,
      processingCount: this.processingCount,
      workers: this.workers,
      metrics: {
        timestamp: Date.now(),
        queuedCount: this.queuedCount,
        processingCount: this.processingCount,
        committedCount: this.countByStatus('committed'),
        failedCount: this.countByStatus('failed'),
        throughputPerSec: this.throughput.throughputPerSec(),
      },
    };
  }
}

export const venueStore = new VenueStore();
