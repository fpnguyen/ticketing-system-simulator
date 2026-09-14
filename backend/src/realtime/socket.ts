import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { eventBus } from '../domain/eventBus.js';
import { venueStore } from '../state/venueStore.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/** Pure server->client telemetry: the only client-issued event is
 * `join-venue`, which also triggers an immediate snapshot reply so
 * reconnects resync without waiting for the next incremental event. */
export function initRealtime(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: env.CORS_ORIGIN, methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    socket.on('join-venue', ({ venueId }: { venueId: string }) => {
      if (!venueStore.venue || venueStore.venue.venueId !== venueId) return;
      socket.join(venueId);
      socket.emit('venue:snapshot', venueStore.toSnapshot());
    });

    socket.on('disconnect', () => {
      logger.debug({ socketId: socket.id }, 'socket disconnected');
    });
  });

  function room() {
    return venueStore.venue ? io.to(venueStore.venue.venueId) : null;
  }

  eventBus.on('venue:created', () => {
    io.to(venueStore.venue!.venueId).emit('venue:snapshot', venueStore.toSnapshot());
  });
  eventBus.on('seat:update', (seat) => room()?.emit('seat:update', seat));
  eventBus.on('request:update', (request) => room()?.emit('request:update', request));
  eventBus.on('worker:update', (worker) => room()?.emit('worker:update', worker));
  eventBus.on('queue:update', (payload) => room()?.emit('queue:update', payload));
  eventBus.on('metrics:tick', (metrics) => room()?.emit('metrics:tick', metrics));
  eventBus.on('run:started', (payload) => room()?.emit('run:started', payload));
  eventBus.on('run:completed', (payload) => room()?.emit('run:completed', payload));
  eventBus.on('venue:reset', () => room()?.emit('venue:reset', {}));

  return io;
}
