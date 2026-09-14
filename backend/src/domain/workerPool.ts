import { randomUUID } from 'node:crypto';
import { venueStore } from '../state/venueStore.js';
import { eventBus } from './eventBus.js';
import { attemptAllocate, createRequestItem } from './allocationEngine.js';
import { assignHotSeats, pickSeatTargets } from './seatPicker.js';
import { buildMetricsSnapshot } from './metrics.js';
import type { RequestItem, SimulateParams, WorkerState } from './types.js';

const METRICS_TICK_MS = 500;
const TRICKLE_MIN_GAP_MS = 40;
const TRICKLE_MAX_GAP_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function emitQueueUpdate(): void {
  eventBus.emit('queue:update', {
    queuedCount: venueStore.queuedCount,
    processingCount: venueStore.processingCount,
  });
}

async function runWorker(worker: WorkerState): Promise<void> {
  for (;;) {
    const request = await venueStore.queue.take();
    venueStore.queuedCount--;
    venueStore.processingCount++;
    worker.status = 'busy';
    worker.currentRequestId = request.requestId;
    eventBus.emit('worker:update', worker);
    emitQueueUpdate();

    const result = await attemptAllocate(request);
    if (result.completedAt) {
      venueStore.throughput.recordCompletion(result.completedAt);
    }

    venueStore.processingCount--;
    worker.processedCount++;
    worker.status = 'idle';
    worker.currentRequestId = null;
    eventBus.emit('worker:update', worker);
    emitQueueUpdate();

    maybeFinishRun();
  }
}

function ensureWorkerPool(concurrency: number): void {
  if (venueStore.workers.length > 0) return;
  for (let i = 0; i < concurrency; i++) {
    const worker: WorkerState = { workerId: i, status: 'idle', currentRequestId: null, processedCount: 0 };
    venueStore.workers.push(worker);
    void runWorker(worker);
  }
}

let metricsTimer: ReturnType<typeof setInterval> | null = null;

function ensureMetricsTicker(): void {
  if (metricsTimer) return;
  metricsTimer = setInterval(() => {
    if (!venueStore.venue) return;
    eventBus.emit(
      'metrics:tick',
      buildMetricsSnapshot({
        queuedCount: venueStore.queuedCount,
        processingCount: venueStore.processingCount,
        committedCount: venueStore.countByStatus('committed'),
        failedCount: venueStore.countByStatus('failed'),
        throughputPerSec: venueStore.throughput.throughputPerSec(),
      }),
    );
  }, METRICS_TICK_MS);
  metricsTimer.unref?.();
}

function maybeFinishRun(): void {
  const runId = venueStore.activeRunId;
  if (!runId) return;
  if (venueStore.queuedCount > 0 || venueStore.processingCount > 0) return;
  const requestCount = [...venueStore.requests.values()].filter((r) => r.runId === runId).length;
  venueStore.activeRunId = null;
  if (venueStore.venue) venueStore.venue.status = 'completed';
  eventBus.emit('run:completed', { runId, requestCount });
}

export async function startSimulationRun(params: SimulateParams): Promise<{ runId: string }> {
  const venue = venueStore.requireVenue();
  ensureWorkerPool(params.concurrency);
  ensureMetricsTicker();

  const seats = [...venue.seats.values()];
  assignHotSeats(seats, params.hotSeatRatio);
  const targets = pickSeatTargets(seats, params.requestCount);

  const runId = randomUUID();
  venueStore.activeRunId = runId;
  venue.status = 'running';
  eventBus.emit('run:started', { runId, requestCount: params.requestCount });

  const enqueueOne = (seatId: string) => {
    const request: RequestItem = createRequestItem({
      venueId: venue.venueId,
      seatId,
      runId,
      source: 'simulation',
    });
    venueStore.requests.set(request.requestId, request);
    venueStore.queuedCount++;
    eventBus.emit('request:update', request);
    emitQueueUpdate();
    venueStore.queue.put(request);
  };

  if (params.arrivalPattern === 'burst') {
    for (const seatId of targets) enqueueOne(seatId);
  } else {
    void (async () => {
      for (const seatId of targets) {
        enqueueOne(seatId);
        const gap = TRICKLE_MIN_GAP_MS + Math.random() * (TRICKLE_MAX_GAP_MS - TRICKLE_MIN_GAP_MS);
        await sleep(gap);
      }
    })();
  }

  return { runId };
}
