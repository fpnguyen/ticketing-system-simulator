import type { SeatState } from './types.js';

const DEFAULT_HOT_SEAT_RATIO = 0.15;
const HOT_SEAT_WEIGHT = 5;

/** Marks a random subset of seats "hot" so simulated runs reliably produce
 * visible same-seat contention rather than relying on luck. */
export function assignHotSeats(seats: SeatState[], hotSeatRatio: number = DEFAULT_HOT_SEAT_RATIO): void {
  const hotCount = Math.max(1, Math.round(seats.length * hotSeatRatio));
  const shuffled = [...seats].sort(() => Math.random() - 0.5);
  for (const seat of seats) seat.isHot = false;
  for (const seat of shuffled.slice(0, hotCount)) seat.isHot = true;
}

/** Weighted-random sample (with replacement) of `count` seat ids, favoring hot seats. */
export function pickSeatTargets(seats: SeatState[], count: number): string[] {
  const weighted: string[] = [];
  for (const seat of seats) {
    const weight = seat.isHot ? HOT_SEAT_WEIGHT : 1;
    for (let i = 0; i < weight; i++) weighted.push(seat.seatId);
  }
  const targets: string[] = [];
  for (let i = 0; i < count; i++) {
    targets.push(weighted[Math.floor(Math.random() * weighted.length)]);
  }
  return targets;
}
