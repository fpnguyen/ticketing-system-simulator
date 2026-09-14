import { useMemo } from 'react';
import { useSimulationStore } from '../state/useSimulationStore';
import { cancelSeat } from '../api/client';

interface ManualControlsPanelProps {
  venueId: string;
  onError: (message: string) => void;
}

export function ManualControlsPanel({ venueId, onError }: ManualControlsPanelProps) {
  const seatsMap = useSimulationStore((s) => s.seats);
  const log = useSimulationStore((s) => s.log);

  const soldSeats = useMemo(
    () =>
      [...seatsMap.values()]
        .filter((s) => s.status === 'sold')
        .sort((a, b) => a.row - b.row || a.column - b.column),
    [seatsMap],
  );

  const customerBySeat = useMemo(() => {
    const map = new Map<string, string>();
    for (const request of log) {
      if (request.status === 'committed' && !map.has(request.seatId)) {
        map.set(request.seatId, request.customer.fullName);
      }
    }
    return map;
  }, [log]);

  async function handleCancel(seatId: string) {
    try {
      await cancelSeat(venueId, seatId);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Cancel failed');
    }
  }

  return (
    <div className="card">
      <h3>Sold seats ({soldSeats.length})</h3>
      <div style={{ maxHeight: 320, overflowY: 'auto', marginTop: 8 }}>
        {soldSeats.length === 0 && <p className="muted">No seats sold yet.</p>}
        {soldSeats.length > 0 && (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr className="secondary" style={{ textAlign: 'left', fontSize: 11 }}>
                <th style={{ paddingBottom: 4 }}>Seat</th>
                <th style={{ paddingBottom: 4 }}>Customer</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {soldSeats.map((seat) => (
                <tr key={seat.seatId} style={{ borderTop: '1px solid var(--gridline)' }}>
                  <td style={{ padding: '5px 0' }}>{seat.seatId}</td>
                  <td style={{ padding: '5px 0' }}>{customerBySeat.get(seat.seatId) ?? '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" onClick={() => handleCancel(seat.seatId)}>
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
