import { useMemo } from 'react';
import { Seat } from './Seat';
import { useSimulationStore } from '../state/useSimulationStore';
import { allocateSeat, cancelSeat } from '../api/client';
import type { SeatState } from '../types/shared';

interface SeatGridProps {
  venueId: string;
  columns: number;
  onError: (message: string) => void;
}

export function SeatGrid({ venueId, columns, onError }: SeatGridProps) {
  const seatsMap = useSimulationStore((s) => s.seats);
  const seats = useMemo(() => [...seatsMap.values()].sort((a, b) => a.row - b.row || a.column - b.column), [seatsMap]);

  async function handleSeatClick(seat: SeatState) {
    try {
      if (seat.status === 'available') {
        await allocateSeat(venueId, seat.seatId);
      } else if (seat.status === 'sold') {
        if (!confirm(`Cancel the ticket for seat R${seat.row + 1}C${seat.column + 1}?`)) return;
        await cancelSeat(venueId, seat.seatId);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Action failed');
    }
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h3>Seat map</h3>
        <div className="muted" style={{ fontSize: 12, display: 'flex', gap: 12 }}>
          <Legend color="var(--seat-available)" label="Available" />
          <Legend color="var(--status-warning)" label="Held" />
          <Legend color="var(--status-good)" label="Sold" />
          <span>🔥 Hot seat</span>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 22px)`,
          gap: 4,
          marginTop: 12,
          overflow: 'auto',
        }}
      >
        {seats.map((seat) => (
          <Seat key={seat.seatId} seat={seat} onClick={handleSeatClick} />
        ))}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}
