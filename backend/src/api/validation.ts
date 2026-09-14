import { z } from 'zod';
import { MAX_GRID_DIMENSION } from '../domain/venueFactory.js';

export const createVenueSchema = z.object({
  rows: z.number().int().min(1).max(MAX_GRID_DIMENSION),
  columns: z.number().int().min(1).max(MAX_GRID_DIMENSION),
  name: z.string().trim().min(1).max(120).optional(),
});

export const simulateSchema = z.object({
  requestCount: z.number().int().min(1).max(5000),
  concurrency: z.number().int().min(1).max(20).default(5),
  arrivalPattern: z.enum(['burst', 'trickle']).default('burst'),
  hotSeatRatio: z.number().min(0).max(1).optional(),
});

export const resetVenueSchema = z.object({
  purgeHistory: z.boolean().default(false),
});

export const manualAllocateSchema = z.object({
  customer: z
    .object({
      fullName: z.string().trim().min(1).max(120),
      dateOfBirth: z.string().min(1),
    })
    .optional(),
});
