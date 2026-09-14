import { randomUUID } from 'node:crypto';
import { venueStore } from '../state/venueStore.js';
import { eventBus } from './eventBus.js';
import { generateCustomer } from './customerGenerator.js';
import { SeatLockManager } from './seatLock.js';
import type { Customer, RequestItem, RequestSource } from './types.js';

export const seatLock = new SeatLockManager();

/** Artificial per-seat processing delay, tunable so tests can shrink it to
 * run fast while the real app stays slow enough to watch. */
export const processingDelay = { minMs: 800, maxMs: 2000 };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateRequest(request: RequestItem, patch: Partial<RequestItem>): RequestItem {
  Object.assign(request, patch);
  venueStore.requests.set(request.requestId, request);
  eventBus.emit('request:update', request);
  return request;
}

export function createRequestItem(params: {
  venueId: string;
  seatId: string;
  runId: string | null;
  source: RequestSource;
  customer?: Customer;
}): RequestItem {
  return {
    requestId: randomUUID(),
    venueId: params.venueId,
    runId: params.runId,
    seatId: params.seatId,
    customer: params.customer ?? generateCustomer(),
    source: params.source,
    status: 'queued',
    failureReason: null,
    ticketId: null,
    enqueuedAt: Date.now(),
    processingStartedAt: null,
    completedAt: null,
  };
}

/**
 * The single place seat state is ever mutated, for both queued simulation
 * requests and manual actions. Correctness comes entirely from running the
 * check-hold-commit sequence inside the per-seat mutex: whichever caller
 * gets in first sees `available` and wins; every later caller for the same
 * seat sees `held`/`sold` and fails, regardless of timing or delays below.
 */
export async function attemptAllocate(request: RequestItem): Promise<RequestItem> {
  return seatLock.runExclusive(request.seatId, async () => {
    updateRequest(request, { status: 'processing', processingStartedAt: Date.now() });

    const seat = venueStore.getSeat(request.seatId);
    if (seat.status !== 'available') {
      return updateRequest(request, {
        status: 'failed',
        failureReason: 'seat_unavailable',
        completedAt: Date.now(),
      });
    }

    seat.status = 'held';
    seat.requestId = request.requestId;
    eventBus.emit('seat:update', seat);

    // Artificial pacing purely for visualization. Safe here specifically
    // because it runs inside the per-seat mutex: unrelated seats keep
    // processing fully in parallel while only same-seat contenders wait.
    await sleep(randomBetween(processingDelay.minMs, processingDelay.maxMs));

    const ticketId = randomUUID();
    seat.status = 'sold';
    seat.ticketId = ticketId;
    eventBus.emit('seat:update', seat);

    return updateRequest(request, { status: 'committed', ticketId, completedAt: Date.now() });
  });
}

export async function manualCancel(seatId: string): Promise<void> {
  await seatLock.runExclusive(seatId, () => {
    const seat = venueStore.getSeat(seatId);
    if (seat.status !== 'sold') {
      throw new Error('Seat is not currently sold');
    }
    const owningRequest = seat.requestId ? venueStore.requests.get(seat.requestId) : null;
    seat.status = 'available';
    seat.requestId = null;
    seat.ticketId = null;
    eventBus.emit('seat:update', seat);
    if (owningRequest) {
      updateRequest(owningRequest, { status: 'cancelled', completedAt: Date.now() });
    }
  });
}

export async function manualAllocate(seatId: string, customer?: Customer): Promise<RequestItem> {
  const venue = venueStore.requireVenue();
  const seat = venueStore.getSeat(seatId);
  if (seat.status !== 'available') {
    throw new Error('Seat is not available');
  }
  const request = createRequestItem({ venueId: venue.venueId, seatId, runId: null, source: 'manual', customer });
  venueStore.requests.set(request.requestId, request);
  eventBus.emit('request:update', request);
  return attemptAllocate(request);
}
