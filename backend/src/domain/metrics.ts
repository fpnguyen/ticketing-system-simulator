import type { MetricsSnapshot } from './types.js';

const WINDOW_MS = 5000;

interface CompletionEvent {
  timestamp: number;
}

/** Tracks a rolling window of completions to compute a live throughput figure. */
export class ThroughputTracker {
  private completions: CompletionEvent[] = [];

  recordCompletion(timestamp: number = Date.now()): void {
    this.completions.push({ timestamp });
    this.prune(timestamp);
  }

  private prune(now: number): void {
    const cutoff = now - WINDOW_MS;
    while (this.completions.length > 0 && this.completions[0].timestamp < cutoff) {
      this.completions.shift();
    }
  }

  throughputPerSec(now: number = Date.now()): number {
    this.prune(now);
    return this.completions.length / (WINDOW_MS / 1000);
  }
}

export function buildMetricsSnapshot(params: {
  queuedCount: number;
  processingCount: number;
  committedCount: number;
  failedCount: number;
  throughputPerSec: number;
}): MetricsSnapshot {
  return { timestamp: Date.now(), ...params };
}
