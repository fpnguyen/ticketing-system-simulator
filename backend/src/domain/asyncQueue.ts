/** FIFO queue with async consumers. No busy-polling: `take()` resolves
 * immediately when an item is available, or waits for the next `put()`. */
export class AsyncQueue<T> {
  private items: T[] = [];
  private waiters: Array<(item: T) => void> = [];

  put(item: T): void {
    const waiter = this.waiters.shift();
    if (waiter) {
      waiter(item);
    } else {
      this.items.push(item);
    }
  }

  take(): Promise<T> {
    const item = this.items.shift();
    if (item !== undefined) {
      return Promise.resolve(item);
    }
    return new Promise((resolve) => {
      this.waiters.push(resolve);
    });
  }

  get size(): number {
    return this.items.length;
  }
}
