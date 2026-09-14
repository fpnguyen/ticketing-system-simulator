import { randomUUID } from 'node:crypto';
import type { SeatState, VenueState } from './types.js';

export const MAX_GRID_DIMENSION = 30;

export function seatIdFor(row: number, column: number): string {
  return `r${row}-c${column}`;
}

export function createVenue(params: { rows: number; columns: number; name?: string | null }): VenueState {
  const { rows, columns, name = null } = params;
  const seats = new Map<string, SeatState>();
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const seatId = seatIdFor(row, column);
      seats.set(seatId, {
        seatId,
        row,
        column,
        status: 'available',
        requestId: null,
        ticketId: null,
        isHot: false,
      });
    }
  }
  return {
    venueId: randomUUID(),
    name,
    rows,
    columns,
    status: 'idle',
    seats,
    createdAt: Date.now(),
  };
}
