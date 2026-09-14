// Hand-mirrored from backend/src/domain/types.ts — see API_CONTRACT.md.

export type SeatStatus = 'available' | 'held' | 'sold';

export interface SeatState {
  seatId: string;
  row: number;
  column: number;
  status: SeatStatus;
  requestId: string | null;
  ticketId: string | null;
  isHot: boolean;
}

export type VenueStatus = 'idle' | 'running' | 'completed';

export interface VenueSummary {
  venueId: string;
  name: string | null;
  rows: number;
  columns: number;
  status: VenueStatus;
}

export type RequestStatus = 'queued' | 'processing' | 'committed' | 'failed' | 'cancelled';
export type RequestSource = 'simulation' | 'manual';

export interface Customer {
  fullName: string;
  dateOfBirth: string;
}

export interface RequestItem {
  requestId: string;
  venueId: string;
  runId: string | null;
  seatId: string;
  customer: Customer;
  source: RequestSource;
  status: RequestStatus;
  failureReason: 'seat_unavailable' | null;
  ticketId: string | null;
  enqueuedAt: number;
  processingStartedAt: number | null;
  completedAt: number | null;
}

export type WorkerStatus = 'idle' | 'busy';

export interface WorkerState {
  workerId: number;
  status: WorkerStatus;
  currentRequestId: string | null;
  processedCount: number;
}

export interface MetricsSnapshot {
  timestamp: number;
  queuedCount: number;
  processingCount: number;
  committedCount: number;
  failedCount: number;
  throughputPerSec: number;
}

export interface VenueSnapshot {
  venue: VenueSummary;
  seats: SeatState[];
  queuedCount: number;
  processingCount: number;
  workers: WorkerState[];
  metrics: MetricsSnapshot;
}

export type ArrivalPattern = 'burst' | 'trickle';

export interface SimulateParams {
  requestCount: number;
  concurrency: number;
  arrivalPattern: ArrivalPattern;
  hotSeatRatio?: number;
}
