import { create } from 'zustand';
import type {
  MetricsSnapshot,
  RequestItem,
  SeatState,
  VenueSnapshot,
  VenueSummary,
  WorkerState,
} from '../types/shared';

const METRICS_HISTORY_LIMIT = 120;
const LOG_LIMIT = 200;

interface RunBanner {
  runId: string;
  requestCount: number;
  status: 'running' | 'completed';
}

interface SimulationState {
  venue: VenueSummary | null;
  seats: Map<string, SeatState>;
  workers: WorkerState[];
  queuedCount: number;
  processingCount: number;
  metrics: MetricsSnapshot | null;
  metricsHistory: MetricsSnapshot[];
  log: RequestItem[];
  run: RunBanner | null;
  connected: boolean;

  setConnected: (connected: boolean) => void;
  applySnapshot: (snapshot: VenueSnapshot) => void;
  applySeatUpdate: (seat: SeatState) => void;
  applyRequestUpdate: (request: RequestItem) => void;
  applyWorkerUpdate: (worker: WorkerState) => void;
  applyQueueUpdate: (payload: { queuedCount: number; processingCount: number }) => void;
  applyMetricsTick: (metrics: MetricsSnapshot) => void;
  applyRunStarted: (payload: { runId: string; requestCount: number }) => void;
  applyRunCompleted: (payload: { runId: string; requestCount: number }) => void;
  applyVenueReset: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  venue: null,
  seats: new Map(),
  workers: [],
  queuedCount: 0,
  processingCount: 0,
  metrics: null,
  metricsHistory: [],
  log: [],
  run: null,
  connected: false,

  setConnected: (connected) => set({ connected }),

  applySnapshot: (snapshot) =>
    set({
      venue: snapshot.venue,
      seats: new Map(snapshot.seats.map((s) => [s.seatId, s])),
      workers: snapshot.workers,
      queuedCount: snapshot.queuedCount,
      processingCount: snapshot.processingCount,
      metrics: snapshot.metrics,
    }),

  applySeatUpdate: (seat) =>
    set((state) => {
      const seats = new Map(state.seats);
      seats.set(seat.seatId, seat);
      return { seats };
    }),

  applyRequestUpdate: (request) =>
    set((state) => ({
      log: [request, ...state.log.filter((r) => r.requestId !== request.requestId)].slice(0, LOG_LIMIT),
    })),

  applyWorkerUpdate: (worker) =>
    set((state) => ({
      workers: state.workers.some((w) => w.workerId === worker.workerId)
        ? state.workers.map((w) => (w.workerId === worker.workerId ? worker : w))
        : [...state.workers, worker].sort((a, b) => a.workerId - b.workerId),
    })),

  applyQueueUpdate: (payload) => set(payload),

  applyMetricsTick: (metrics) =>
    set((state) => ({
      metrics,
      metricsHistory: [...state.metricsHistory, metrics].slice(-METRICS_HISTORY_LIMIT),
    })),

  applyRunStarted: (payload) => set({ run: { ...payload, status: 'running' } }),

  applyRunCompleted: (payload) =>
    set((state) => (state.run?.runId === payload.runId ? { run: { ...payload, status: 'completed' } } : {})),

  applyVenueReset: () =>
    set((state) => ({
      seats: new Map([...state.seats].map(([id, seat]) => [id, { ...seat, status: 'available', requestId: null, ticketId: null, isHot: false }])),
      log: [],
      metricsHistory: [],
      metrics: null,
      run: null,
      queuedCount: 0,
      processingCount: 0,
    })),
}));
