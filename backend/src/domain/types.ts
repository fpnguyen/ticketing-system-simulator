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

export interface VenueState {
  venueId: string;
  name: string | null;
  rows: number;
  columns: number;
  status: VenueStatus;
  seats: Map<string, SeatState>;
  createdAt: number;
}

export type RequestStatus = 'queued' | 'processing' | 'committed' | 'failed' | 'cancelled';
export type RequestSource = 'simulation' | 'manual';
export type FailureReason = 'seat_unavailable' | null;

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
  failureReason: FailureReason;
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

export type ArrivalPattern = 'burst' | 'trickle';

export interface SimulateParams {
  requestCount: number;
  concurrency: number;
  arrivalPattern: ArrivalPattern;
  hotSeatRatio?: number;
}
