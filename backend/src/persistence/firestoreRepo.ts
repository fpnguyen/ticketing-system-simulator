import type { firestore as FirestoreNS } from 'firebase-admin';
import { firestore } from '../config/firebase.js';
import { logger } from '../utils/logger.js';
import type { RequestItem, SeatState, VenueState } from '../domain/types.js';

const BATCH_LIMIT = 500;

async function chunkedBatchWrite(writes: Array<(batch: FirestoreNS.WriteBatch) => void>): Promise<void> {
  if (!firestore) return;
  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    const batch = firestore.batch();
    for (const write of writes.slice(i, i + BATCH_LIMIT)) write(batch);
    await batch.commit();
  }
}

function seatDoc(seat: SeatState) {
  return {
    seatId: seat.seatId,
    row: seat.row,
    column: seat.column,
    status: seat.status,
    currentRequestId: seat.requestId,
    currentTicketId: seat.ticketId,
    updatedAt: new Date(),
  };
}

function requestDoc(request: RequestItem) {
  return {
    requestId: request.requestId,
    venueId: request.venueId,
    runId: request.runId,
    seatId: request.seatId,
    customer: request.customer,
    source: request.source,
    status: request.status,
    failureReason: request.failureReason,
    ticketId: request.ticketId,
    createdAt: new Date(request.enqueuedAt),
    processingStartedAt: request.processingStartedAt ? new Date(request.processingStartedAt) : null,
    completedAt: request.completedAt ? new Date(request.completedAt) : null,
  };
}

/** Every function here is storage-only: called after the in-memory engine has
 * already decided an outcome, never consulted to decide one. Failures are
 * logged and swallowed — persistence must never block or fail the simulation. */
export async function persistVenueCreated(venue: VenueState): Promise<void> {
  if (!firestore) return;
  try {
    const venueRef = firestore.collection('venues').doc(venue.venueId);
    await venueRef.set({
      venueId: venue.venueId,
      name: venue.name,
      rows: venue.rows,
      columns: venue.columns,
      totalSeats: venue.seats.size,
      status: venue.status,
      createdAt: new Date(venue.createdAt),
    });
    const seatsRef = venueRef.collection('seats');
    const writes = [...venue.seats.values()].map(
      (seat) => (batch: FirestoreNS.WriteBatch) => batch.set(seatsRef.doc(seat.seatId), seatDoc(seat)),
    );
    await chunkedBatchWrite(writes);
  } catch (err) {
    logger.error({ err }, 'Failed to persist venue creation');
  }
}

export async function persistSeatUpdate(venueId: string, seat: SeatState): Promise<void> {
  if (!firestore) return;
  try {
    await firestore.collection('venues').doc(venueId).collection('seats').doc(seat.seatId).set(seatDoc(seat));
  } catch (err) {
    logger.error({ err }, 'Failed to persist seat update');
  }
}

export async function persistRequestUpdate(request: RequestItem): Promise<void> {
  if (!firestore) return;
  try {
    await firestore.collection('requests').doc(request.requestId).set(requestDoc(request));
  } catch (err) {
    logger.error({ err }, 'Failed to persist request update');
  }
}

export async function resetVenueSeats(venue: VenueState): Promise<void> {
  if (!firestore) return;
  try {
    const seatsRef = firestore.collection('venues').doc(venue.venueId).collection('seats');
    const writes = [...venue.seats.values()].map(
      (seat) => (batch: FirestoreNS.WriteBatch) => batch.set(seatsRef.doc(seat.seatId), seatDoc(seat)),
    );
    await chunkedBatchWrite(writes);
  } catch (err) {
    logger.error({ err }, 'Failed to persist venue reset');
  }
}

export async function purgeVenueRequests(venueId: string): Promise<void> {
  if (!firestore) return;
  try {
    const snapshot = await firestore.collection('requests').where('venueId', '==', venueId).get();
    const writes = snapshot.docs.map((doc) => (batch: FirestoreNS.WriteBatch) => batch.delete(doc.ref));
    await chunkedBatchWrite(writes);
  } catch (err) {
    logger.error({ err }, 'Failed to purge venue requests');
  }
}
