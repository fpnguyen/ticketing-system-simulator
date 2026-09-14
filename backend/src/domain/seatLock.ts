/**
 * Per-seat async mutex. Serializes every critical section touching a given
 * seatId, regardless of what each callback awaits internally — this is the
 * sole source of allocation correctness (no Firestore transaction involved).
 */
export class SeatLockManager {
  private locks = new Map<string, Promise<unknown>>();

  runExclusive<T>(seatId: string, fn: () => Promise<T> | T): Promise<T> {
    const prior = this.locks.get(seatId) ?? Promise.resolve();
    const run = prior.then(fn, fn);
    this.locks.set(
      seatId,
      run.then(
        () => undefined,
        () => undefined,
      ),
    );
    return run;
  }
}
