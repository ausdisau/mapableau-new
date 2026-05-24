import { z } from "zod";

export const accessNeedsSchema = z.object({
  boardingAssistance: z.boolean().optional(),
  transferAssistance: z.boolean().optional(),
  sensoryConsiderations: z.string().optional(),
  maxTimeInVehicleMinutes: z.number().int().positive().optional(),
  hoistRequired: z.boolean().optional(),
  notes: z.string().optional(),
});

export const communicationPreferencesSchema = z.object({
  preferredMethod: z.enum(["phone", "sms", "email", "in_app"]).optional(),
  plainLanguage: z.boolean().optional(),
  noUnexpectedCalls: z.boolean().optional(),
  notes: z.string().optional(),
});

export const vehicleRequirementsSchema = z.object({
  requiresWheelchairAccessible: z.boolean().optional(),
  requiresRamp: z.boolean().optional(),
  requiresLift: z.boolean().optional(),
  assistanceAnimal: z.boolean().optional(),
  seatedCapacityMin: z.number().int().min(1).max(20).optional(),
});

export const mobilityAidSnapshotSchema = z.object({
  wheelchair: z.boolean().optional(),
  powerWheelchair: z.boolean().optional(),
  walker: z.boolean().optional(),
  other: z.string().optional(),
});

export const createTransportBookingOsmSchema = z.object({
  transportType: z
    .enum(["one_way", "return_trip", "multi_stop_placeholder"])
    .optional(),
  pickupAddress: z.string().min(3),
  dropoffAddress: z.string().min(3),
  pickupWindowStart: z.string().datetime(),
  pickupWindowEnd: z.string().datetime().optional(),
  returnTripRequired: z.boolean().optional(),
  passengerCount: z.number().int().min(1).max(8).optional(),
  companionCount: z.number().int().min(0).max(8).optional(),
  accessNeeds: accessNeedsSchema.optional(),
  mobilityAidSnapshot: mobilityAidSnapshotSchema.optional(),
  vehicleRequirements: vehicleRequirementsSchema.optional(),
  communicationPreferences: communicationPreferencesSchema.optional(),
  driverAssistanceRequired: z.boolean().optional(),
  pickupNotes: z.string().optional(),
  dropoffNotes: z.string().optional(),
  shareAccessibility: z.boolean().optional(),
  shareAccessibilityConfirmed: z.boolean().optional(),
  careRequestId: z.string().optional(),
  status: z.enum(["draft", "quote_requested"]).optional(),
});

export const transitionTripStatusSchema = z.object({
  toStatus: z.enum([
    "draft",
    "quote_requested",
    "quoted",
    "participant_confirmed",
    "provider_accepted",
    "driver_assigned",
    "vehicle_dispatched",
    "arrived_at_pickup",
    "passenger_onboard",
    "arrived_at_destination",
    "completed",
    "invoiced",
    "paid",
    "cancelled",
    "late_risk",
    "no_show",
    "access_issue",
    "incident_reported",
    "disputed",
  ]),
  reason: z.string().optional(),
});

export const createTripQuoteSchema = z.object({
  transportBookingId: z.string().min(1),
});

export const manualDispatchAssignSchema = z.object({
  transportBookingId: z.string().min(1),
  driverProfileId: z.string().min(1),
  vehicleId: z.string().min(1),
  force: z.boolean().optional(),
});

export const transportMessageSchema = z.object({
  body: z.string().min(1).max(4000),
});

export const careTransportBundleSchema = z.object({
  careTitle: z.string().min(3),
  careDescription: z.string().min(3),
  carePreferredDate: z.string().datetime().optional(),
  pickupAddress: z.string().min(3),
  dropoffAddress: z.string().min(3),
  pickupWindowStart: z.string().datetime(),
  pickupWindowEnd: z.string().datetime().optional(),
  accessNeeds: accessNeedsSchema.optional(),
  mobilityAidSnapshot: mobilityAidSnapshotSchema.optional(),
  vehicleRequirements: vehicleRequirementsSchema.optional(),
  communicationPreferences: communicationPreferencesSchema.optional(),
  companionCount: z.number().int().min(0).max(8).optional(),
  pickupNotes: z.string().optional(),
});
