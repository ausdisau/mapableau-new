import { z } from "zod";

export const accessibleDestinationProfileSchema = z.object({
  placeId: z.string(),
  destinationName: z.string(),
  accessSummary: z.object({
    overallAccessScore: z.number().nullable(),
    confidenceScore: z.number().nullable(),
    lastVerifiedAt: z.string().nullable(),
    activeAlerts: z.array(z.string()),
  }),
  arrivalRequirements: z.object({
    preferredEntranceId: z.string().optional(),
    accessibleDropoffPointId: z.string().optional(),
    accessibleParkingId: z.string().optional(),
    stepFreeRequired: z.boolean(),
    liftRequired: z.boolean().optional(),
    maxDistanceFromDropoffMeters: z.number().optional(),
    avoidSteepGradients: z.boolean().optional(),
    avoidCrowds: z.boolean().optional(),
    sensoryLowStimulusPreferred: z.boolean().optional(),
  }),
  transportInstructions: z.object({
    driverNotes: z.string().optional(),
    pickupAssistanceRequired: z.boolean().optional(),
    dropoffAssistanceRequired: z.boolean().optional(),
    mobilityAidType: z
      .enum(["manual_wheelchair", "powerchair", "scooter", "walker", "other"])
      .optional(),
    companionCount: z.number().optional(),
  }),
  destinationCoordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  dropoffAddress: z.string().optional(),
  accessWarnings: z.array(z.string()).default([]),
});

export type AccessibleDestinationProfile = z.infer<
  typeof accessibleDestinationProfileSchema
>;

export const journeyConfidenceScoreSchema = z.object({
  routeConfidence: z.number(),
  destinationConfidence: z.number(),
  vehicleFitConfidence: z.number(),
  dropoffConfidence: z.number(),
  liveAlertRisk: z.number(),
  overallJourneyConfidence: z.number(),
});

export type JourneyConfidenceScore = z.infer<
  typeof journeyConfidenceScoreSchema
>;

export const accessTripFeedbackSchema = z.object({
  tripId: z.string(),
  placeId: z.string().optional(),
  dropoffAccessible: z.boolean().optional(),
  entranceCorrect: z.boolean().optional(),
  barriersNotes: z.string().max(2000).optional(),
  createAlert: z.boolean().default(false),
});

export const planAccessibleTripSchema = z.object({
  placeId: z.string(),
  scheduledStart: z.string().datetime(),
  pickupAddress: z.string().min(3),
  pickupSuburb: z.string().optional(),
  prefillFromProfile: z.boolean().default(true),
});
