import { z } from "zod";

export const transportMvpTripStatusSchema = z.enum([
  "requested",
  "accepted",
  "dispatched",
  "driver_en_route",
  "arrived_pickup",
  "on_board",
  "in_transit",
  "arrived_dropoff",
  "completed",
  "cancelled",
  "disputed",
]);

export const createTransportTripRequestSchema = z.object({
  pickupAddress: z.string().min(3),
  dropoffAddress: z.string().min(3),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  dropoffLat: z.number().optional(),
  dropoffLng: z.number().optional(),
  pickupWindowStart: z.string().datetime(),
  pickupWindowEnd: z.string().datetime().optional(),
  pickupNotes: z.string().optional(),
  dropoffNotes: z.string().optional(),
  passengerCount: z.number().int().min(1).max(8).optional(),
  organisationId: z.string().optional(),
  wheelchairRequired: z.boolean().optional(),
  assistedPickup: z.boolean().optional(),
  assistedDropoff: z.boolean().optional(),
  driverAssistanceRequired: z.boolean().optional(),
  mobilityAidsJson: z.record(z.string(), z.unknown()).optional(),
  assistanceNotes: z.string().optional(),
  shareAccessibility: z.boolean().optional(),
  shareAccessibilityConfirmed: z.boolean().optional(),
});

export const assignDispatchSchema = z.object({
  driverId: z.string(),
  vehicleId: z.string(),
  allowSuitabilityOverride: z.boolean().optional(),
});

export const updateTripStatusSchema = z.object({
  status: transportMvpTripStatusSchema,
  message: z.string().optional(),
});

export const recordTripEvidenceSchema = z.object({
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  distanceKm: z.number().positive(),
  notes: z.string().optional(),
});

export const disputeTripSchema = z.object({
  reason: z.string().min(3),
});

export const safetyReportSchema = z.object({
  tripId: z.string().optional(),
  title: z.string().min(3),
  description: z.string().min(10),
  severity: z.enum(["low", "medium", "high", "critical"]),
  immediateRiskPresent: z.boolean().optional(),
});
