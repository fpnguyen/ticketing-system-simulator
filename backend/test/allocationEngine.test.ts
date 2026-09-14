import { describe, expect, it, beforeEach } from 'vitest';
import { venueStore } from '../src/state/venueStore.js';
import { createVenue } from '../src/domain/venueFactory.js';
import { manualAllocate, manualCancel } from '../src/domain/allocationEngine.js';

describe('manual allocation actions', () => {
  beforeEach(() => {
    venueStore.reset(createVenue({ rows: 2, columns: 2 }));
  });

  it('manually allocates an available seat to a given customer', async () => {
    const seatId = 'r0-c0';
    const request = await manualAllocate(seatId, { fullName: 'Ada Lovelace', dateOfBirth: '1815-12-10' });
    expect(request.status).toBe('committed');
    expect(request.customer.fullName).toBe('Ada Lovelace');
    expect(venueStore.getSeat(seatId).status).toBe('sold');
  });

  it('rejects manual allocation of an already-sold seat', async () => {
    const seatId = 'r0-c0';
    await manualAllocate(seatId);
    await expect(manualAllocate(seatId)).rejects.toThrow('Seat is not available');
  });

  it('rejects cancelling a seat that is not sold', async () => {
    await expect(manualCancel('r0-c0')).rejects.toThrow('Seat is not currently sold');
  });

  it('frees a seat on cancellation so it can be reallocated', async () => {
    const seatId = 'r0-c0';
    await manualAllocate(seatId);
    await manualCancel(seatId);
    expect(venueStore.getSeat(seatId).status).toBe('available');
    const request = await manualAllocate(seatId);
    expect(request.status).toBe('committed');
  });
});
