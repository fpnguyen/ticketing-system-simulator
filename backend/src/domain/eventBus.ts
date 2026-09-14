import { EventEmitter } from 'node:events';
import type { RequestItem, SeatState, WorkerState, MetricsSnapshot, VenueState } from './types.js';

export interface EngineEvents {
  'seat:update': (seat: SeatState) => void;
  'request:update': (request: RequestItem) => void;
  'worker:update': (worker: WorkerState) => void;
  'queue:update': (payload: { queuedCount: number; processingCount: number }) => void;
  'metrics:tick': (metrics: MetricsSnapshot) => void;
  'run:started': (payload: { runId: string; requestCount: number }) => void;
  'run:completed': (payload: { runId: string; requestCount: number }) => void;
  'venue:reset': () => void;
  'venue:created': (venue: VenueState) => void;
}

export class EngineEventBus extends EventEmitter {
  override on<K extends keyof EngineEvents>(event: K, listener: EngineEvents[K]): this {
    return super.on(event, listener as (...args: unknown[]) => void);
  }

  override emit<K extends keyof EngineEvents>(event: K, ...args: Parameters<EngineEvents[K]>): boolean {
    return super.emit(event, ...args);
  }
}

export const eventBus = new EngineEventBus();
