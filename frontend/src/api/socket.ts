import { io, type Socket } from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;
let joinedVenueId: string | null = null;

/** Singleton socket. Re-emits `join-venue` on every connect (including
 * automatic reconnects) so a `venue:snapshot` reply always resyncs local
 * state — sockets can silently miss events during a disconnect gap. */
export function getSocket(): Socket {
  if (socket) return socket;
  socket = io(BASE_URL, { autoConnect: true });
  socket.on('connect', () => {
    if (joinedVenueId) socket!.emit('join-venue', { venueId: joinedVenueId });
  });
  return socket;
}

export function joinVenue(venueId: string): void {
  joinedVenueId = venueId;
  const s = getSocket();
  if (s.connected) s.emit('join-venue', { venueId });
}
