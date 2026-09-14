import { useSimulationStore } from '../state/useSimulationStore';

export function QueuePipelineView() {
  const queuedCount = useSimulationStore((s) => s.queuedCount);
  const processingCount = useSimulationStore((s) => s.processingCount);
  const workers = useSimulationStore((s) => s.workers);
  const log = useSimulationStore((s) => s.log);
  const run = useSimulationStore((s) => s.run);
  const metrics = useSimulationStore((s) => s.metrics);

  const requestById = new Map(log.map((r) => [r.requestId, r]));

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3>Queue &amp; worker pool</h3>
        {run && (
          <span className="muted" style={{ fontSize: 12 }}>
            Run {run.runId.slice(0, 8)} — {run.status} ({run.requestCount} requests)
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 12, marginBottom: 16 }}>
        <StatTile label="Queued" value={queuedCount} />
        <StatTile label="Processing" value={processingCount} />
        <StatTile label="Committed" value={metrics?.committedCount ?? 0} tone="good" />
        <StatTile label="Failed" value={metrics?.failedCount ?? 0} tone="critical" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {workers.length === 0 && <p className="muted">No workers running yet — start a simulation.</p>}
        {workers.map((worker) => {
          const request = worker.currentRequestId ? requestById.get(worker.currentRequestId) : null;
          return (
            <div
              key={worker.workerId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: worker.status === 'busy' ? 'rgba(42,120,214,0.08)' : 'transparent',
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: worker.status === 'busy' ? 'var(--series-blue)' : 'var(--seat-available)',
                  flexShrink: 0,
                }}
              />
              <span className="secondary" style={{ fontSize: 12, width: 60 }}>
                Worker {worker.workerId}
              </span>
              <span style={{ fontSize: 13, flex: 1 }}>
                {request
                  ? `${request.customer.fullName} → seat ${request.seatId}`
                  : worker.status === 'busy'
                    ? 'Processing…'
                    : 'Idle'}
              </span>
              <span className="muted" style={{ fontSize: 11 }}>
                {worker.processedCount} processed
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatTile({ label, value, tone }: { label: string; value: number; tone?: 'good' | 'critical' }) {
  const color = tone === 'good' ? 'var(--status-good)' : tone === 'critical' ? 'var(--status-critical)' : 'var(--text-primary)';
  return (
    <div style={{ flex: 1, textAlign: 'left' }}>
      <div className="muted" style={{ fontSize: 12 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, color }}>{value.toLocaleString()}</div>
    </div>
  );
}
