import { z } from "zod";

const bookingSegmentSchema = z.object({
  segmentType: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  pickupAddress: z.string().optional(),
  dropoffAddress: z.string().optional(),
  bufferBeforeMinutes: z.number().int().min(0).default(0),
  bufferAfterMinutes: z.number().int().min(0).default(0),
  sortOrder: z.number().int().default(0),
});

const locationSchema = z.object({
  label: z.string().optional(),
  addressLine1: z.string().optional(),
  suburb: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const accessibilityRequirementsSchema = z.object({
  wheelchairAccess: z.boolean().optional(),
  hoistOrTransfer: z.boolean().optional(),
  communicationSupport: z.boolean().optional(),
  sensoryPreferences: z.string().optional(),
  assistanceAnimal: z.boolean().optional(),
  otherNotes: z.string().optional(),
});

const bookingStatusSchema = z.enum([
  "draft",
  "requested",
  "awaiting_provider_acceptance",
  "confirmed",
  "declined",
  "in_progress",
  "completed",
  "cancelled",
  "disputed",
  "invoiced",
  "paid",
]);

export const createBookingSchema = z.object({
  bookingType: z.enum(["care", "transport", "care_transport"]),
  title: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  requestedStart: z.string().min(1),
  requestedEnd: z.string().optional(),
  pickupAddress: z.string().optional(),
  dropoffAddress: z.string().optional(),
  locationFrom: locationSchema.optional(),
  locationTo: locationSchema.optional(),
  careLocation: z.string().optional(),
  accessibilitySummary: z.string().max(5000).optional(),
  accessibilityRequirements: accessibilityRequirementsSchema.optional(),
  participantNotes: z.string().max(5000).optional(),
  assignedOrganisationId: z.string().optional(),
  shareAccessibility: z.boolean().default(false),
  fundingSourceTag: z.string().optional(),
  ndisSupportCategory: z.string().optional(),
  ndisLineItem: z.string().optional(),
  estimatedTotalCents: z.number().int().min(0).optional(),
  preferredCommunicationMethod: z.string().optional(),
  segments: z.array(bookingSegmentSchema).optional(),
  status: bookingStatusSchema.optional(),
});

export const updateBookingSchema = z.object({
  status: bookingStatusSchema.optional(),
  providerNotes: z.string().max(5000).optional(),
  assignedOrganisationId: z.string().optional().nullable(),
  assignedWorkerId: z.string().optional().nullable(),
  assignedDriverId: z.string().optional().nullable(),
  requestedStart: z.string().optional(),
  requestedEnd: z.string().optional().nullable(),
  pickupAddress: z.string().optional().nullable(),
  dropoffAddress: z.string().optional().nullable(),
});

export const completeBookingSchema = z.object({
  actualStartAt: z.string().min(1),
  actualEndAt: z.string().min(1),
  completionNotes: z.string().max(5000).optional(),
  deliveredSupports: z
    .array(
      z.object({
        code: z.string().optional(),
        description: z.string(),
        durationMinutes: z.number().int().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
  actualTotalCents: z.number().int().min(0).optional(),
});

export const assignWorkerSchema = z.object({
  workerUserId: z.string().min(1),
});
