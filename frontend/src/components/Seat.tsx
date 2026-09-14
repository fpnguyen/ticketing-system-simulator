import type { SeatState } from '../types/shared';

const STATUS_COLOR: Record<SeatState['status'], string> = {
  available: 'var(--seat-available)',
  held: 'var(--status-warning)',
  sold: 'var(--status-good)',
};

interface SeatProps {
  seat: SeatState;
  onClick: (seat: SeatState) => void;
}

export function Seat({ seat, onClick }: SeatProps) {
  const label = `Row ${seat.row + 1}, Seat ${seat.column + 1} — ${seat.status}${seat.isHot ? ' (hot)' : ''}`;
  return (
    <button
      type="button"
      onClick={() => onClick(seat)}
      title={label}
      aria-label={label}
      style={{
        width: 22,
        height: 22,
        borderRadius: 5,
        border: seat.isHot ? '1px solid var(--text-primary)' : '1px solid var(--border)',
        background: STATUS_COLOR[seat.status],
        cursor: seat.status === 'held' ? 'wait' : 'pointer',
        padding: 0,
        position: 'relative',
        transition: 'transform 120ms ease',
      }}
    >
      {seat.isHot && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            fontSize: 9,
            lineHeight: 1,
          }}
        >
          🔥
        </span>
      )}
    </button>
  );
}
