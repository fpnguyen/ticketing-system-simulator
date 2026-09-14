import { useSimulationStore } from '../state/useSimulationStore';
import type { RequestItem } from '../types/shared';

const STATUS_COLOR: Record<RequestItem['status'], string> = {
  queued: 'var(--text-muted)',
  processing: 'var(--series-blue)',
  committed: 'var(--status-good)',
  failed: 'var(--status-critical)',
  cancelled: 'var(--text-muted)',
};

export function TransactionLogFeed() {
  const log = useSimulationStore((s) => s.log);

  return (
    <div className="card">
      <h3>Transaction log</h3>
      <div style={{ maxHeight: 320, overflowY: 'auto', fontSize: 13, marginTop: 8 }}>
        {log.length === 0 && <p className="muted">No activity yet.</p>}
        {log.map((request) => (
          <div
            key={request.requestId}
            style={{
              display: 'flex',
              gap: 8,
              padding: '5px 0',
              borderBottom: '1px solid var(--gridline)',
              alignItems: 'baseline',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 8,
                height: 2,
                background: STATUS_COLOR[request.status],
                flexShrink: 0,
                marginTop: 6,
              }}
            />
            <span style={{ flex: 1 }}>
              {request.customer.fullName} → {request.seatId}
              {request.source === 'manual' ? ' (manual)' : ''}
            </span>
            <span style={{ color: STATUS_COLOR[request.status], fontWeight: 600, textTransform: 'uppercase', fontSize: 11 }}>
              {request.status}
              {request.failureReason ? `: ${request.failureReason}` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
