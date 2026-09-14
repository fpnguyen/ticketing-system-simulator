import { getSocket } from '../api/socket';
import { useSimulationStore } from './useSimulationStore';
import type { MetricsSnapshot, RequestItem, SeatState, VenueSnapshot, WorkerState } from '../types/shared';

let wired = false;

/** Registers socket -> store bridging exactly once per page load. */
export function wireSocketListeners(): void {
  if (wired) return;
  wired = true;
  const socket = getSocket();

  socket.on('connect', () => useSimulationStore.getState().setConnected(true));
  socket.on('disconnect', () => useSimulationStore.getState().setConnected(false));

  socket.on('venue:snapshot', (snapshot: VenueSnapshot) => useSimulationStore.getState().applySnapshot(snapshot));
  socket.on('seat:update', (seat: SeatState) => useSimulationStore.getState().applySeatUpdate(seat));
  socket.on('request:update', (request: RequestItem) => useSimulationStore.getState().applyRequestUpdate(request));
  socket.on('worker:update', (worker: WorkerState) => useSimulationStore.getState().applyWorkerUpdate(worker));
  socket.on('queue:update', (payload: { queuedCount: number; processingCount: number }) =>
    useSimulationStore.getState().applyQueueUpdate(payload),
  );
  socket.on('metrics:tick', (metrics: MetricsSnapshot) => useSimulationStore.getState().applyMetricsTick(metrics));
  socket.on('run:started', (payload: { runId: string; requestCount: number }) =>
    useSimulationStore.getState().applyRunStarted(payload),
  );
  socket.on('run:completed', (payload: { runId: string; requestCount: number }) =>
    useSimulationStore.getState().applyRunCompleted(payload),
  );
  socket.on('venue:reset', () => useSimulationStore.getState().applyVenueReset());
}
