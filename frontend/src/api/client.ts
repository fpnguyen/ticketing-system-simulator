import type { Customer, RequestItem, SimulateParams, VenueSnapshot } from '../types/shared';

const BASE_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:4000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.formErrors?.join(', ') ?? body.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function createVenue(params: { rows: number; columns: number; name?: string }): Promise<VenueSnapshot> {
  return request('/api/venues', { method: 'POST', body: JSON.stringify(params) });
}

export function getSnapshot(venueId: string): Promise<VenueSnapshot> {
  return request(`/api/venues/${venueId}/snapshot`);
}

export function startSimulation(venueId: string, params: SimulateParams): Promise<{ runId: string; accepted: boolean }> {
  return request(`/api/venues/${venueId}/simulate`, { method: 'POST', body: JSON.stringify(params) });
}

export function resetVenue(venueId: string, purgeHistory = false): Promise<VenueSnapshot> {
  return request(`/api/venues/${venueId}/reset`, { method: 'POST', body: JSON.stringify({ purgeHistory }) });
}

export function cancelSeat(venueId: string, seatId: string): Promise<VenueSnapshot> {
  return request(`/api/venues/${venueId}/seats/${seatId}/cancel`, { method: 'POST' });
}

export function allocateSeat(venueId: string, seatId: string, customer?: Customer): Promise<RequestItem> {
  return request(`/api/venues/${venueId}/seats/${seatId}/allocate`, {
    method: 'POST',
    body: JSON.stringify({ customer }),
  });
}
