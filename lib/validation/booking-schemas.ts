import { z } from "zod";

import { BOOKING_MODULES, BOOKING_STATUSES } from "@/types/bookings";

const bookingSegmentSchema = z.object({
  segmentType: z.string(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  pickupAddress: z.string().optional(),
  dropoffAddress: z.string().optional(),
  bufferBeforeMinutes: z.number().int().min(0).default(0),
  bufferAfterMinutes: z.number().int().min(0).default(0),
  sortOrder: z.number().int().default(0),
});

export const createBookingSchema = z.object({
  bookingType: z.enum([
    "care",
    "transport",
    "care_transport",
    "telehealth",
    "marketplace",
    "foods",
    "employment",
    "support_coordination",
  ]),
  module: z.enum(BOOKING_MODULES as [string, ...string[]]).optional(),
  requestedStart: z.string().datetime(),
  requestedEnd: z.string().datetime().optional(),
  pickupAddress: z.string().max(500).optional(),
  dropoffAddress: z.string().max(500).optional(),
  careLocation: z.string().max(500).optional(),
  accessibilitySummary: z.string().max(5000).optional(),
  participantNotes: z.string().max(5000).optional(),
  assignedOrganisationId: z.string().optional(),
  shareAccessibility: z.boolean().default(false),
  fundingSourceTag: z.string().max(200).optional(),
  segments: z.array(bookingSegmentSchema).optional(),
  status: z.enum(["draft", "requested"]).optional(),
});

export const updateBookingSchema = z.object({
  requestedStart: z.string().datetime().optional(),
  requestedEnd: z.string().datetime().optional().nullable(),
  pickupAddress: z.string().max(500).optional().nullable(),
  dropoffAddress: z.string().max(500).optional().nullable(),
  careLocation: z.string().max(500).optional().nullable(),
  participantNotes: z.string().max(5000).optional().nullable(),
  providerNotes: z.string().max(5000).optional().nullable(),
  shareAccessibility: z.boolean().optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(2000).optional(),
});

export const confirmBookingSchema = z.object({
  note: z.string().max(2000).optional(),
});

export const disputeBookingSchema = z.object({
  reason: z.string().min(1).max(5000),
});

export const providerResponseSchema = z.object({
  note: z.string().max(5000).optional(),
  organisationId: z.string().optional(),
});

export const assignBookingSchema = z.object({
  assigneeUserId: z.string().min(1),
  assigneeRole: z.enum(["worker", "driver", "practitioner"]),
  notes: z.string().max(2000).optional(),
  organisationId: z.string().optional(),
});

export const createServiceLogSchema = z.object({
  summary: z.string().max(5000).optional(),
  notes: z.string().max(10000).optional(),
  evidenceDocumentIds: z.array(z.string()).optional(),
  submit: z.boolean().default(false),
});

export const createInvoiceSchema = z.object({
  notes: z.string().max(2000).optional(),
});

export const listBookingsQuerySchema = z.object({
  status: z.enum(BOOKING_STATUSES as [string, ...string[]]).optional(),
  module: z.enum(BOOKING_MODULES as [string, ...string[]]).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type AssignBookingInput = z.infer<typeof assignBookingSchema>;
