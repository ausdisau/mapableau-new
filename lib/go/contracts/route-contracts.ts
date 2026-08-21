import { z } from "zod";

export const routeObjectiveSchema = z.enum([
  "FASTEST",
  "SMOOTHEST",
  "LOWEST_GRADIENT",
  "MOST_VERIFIED",
  "FEWEST_CROSSINGS",
  "CUSTOM",
]);

export const surfaceTypeSchema = z.enum([
  "CONCRETE",
  "ASPHALT",
  "PAVERS",
  "GRAVEL",
  "GRASS",
  "WOOD",
  "UNKNOWN",
]);

export const mobilityRoutingProfileSchema = z.object({
  mobilityAidType: z
    .enum(["manual_wheelchair", "power_wheelchair", "mobility_scooter", "other"])
    .optional(),
  chairWidthMm: z.number().int().positive().optional(),
  chairLengthMm: z.number().int().positive().optional(),
  minimumPreferredPathWidthMm: z.number().int().positive().optional(),
  preferredMaximumSlopePercent: z.number().min(0).max(30).optional(),
  absoluteMaximumSlopePercent: z.number().min(0).max(30).optional(),
  preferredMaximumCrossSlopePercent: z.number().min(0).max(15).optional(),
  curbRampRequired: z.boolean().optional(),
  stairsAllowed: z.boolean().optional(),
  preferredSurfaceTypes: z.array(surfaceTypeSchema).optional(),
  avoidedSurfaceTypes: z.array(surfaceTypeSchema).optional(),
  roughSurfaceTolerance: z.enum(["low", "medium", "high"]).optional(),
  unknownSegmentPolicy: z.enum(["avoid", "allow_with_warning"]).optional(),
  lowConfidencePolicy: z.enum(["avoid", "allow_with_warning"]).optional(),
  liftRequirement: z.boolean().optional(),
  accessibleToiletPreference: z.boolean().optional(),
  restStopPreference: z.boolean().optional(),
});

export const planRouteRequestSchema = z.object({
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  destinationPlaceId: z.string().optional(),
  destinationLat: z.number().min(-90).max(90).optional(),
  destinationLng: z.number().min(-180).max(180).optional(),
  profile: mobilityRoutingProfileSchema.optional(),
  objectives: z.array(routeObjectiveSchema).max(3).optional(),
});

export const routeAccessibilitySummarySchema = z.object({
  confidence: z.number().min(0).max(1),
  evidenceCoverage: z.number().min(0).max(1),
  maximumSlopePercent: z.number(),
  minimumWidthMm: z.number(),
  stairs: z.number().int(),
  unknownSegments: z.number().int(),
  temporaryBarriers: z.number().int().optional(),
  lastVerified: z.string().nullable().optional(),
});

export const routeOptionSchema = z.object({
  routeId: z.string(),
  objective: routeObjectiveSchema,
  distanceMetres: z.number(),
  durationMinutes: z.number(),
  accessibility: routeAccessibilitySummarySchema,
  surfaceSummary: z.array(
    z.object({ type: surfaceTypeSchema, percent: z.number() }),
  ),
  warnings: z.array(z.string()),
  explanation: z.string(),
  segmentIds: z.array(z.string()),
});

export const planRouteResponseSchema = z.object({
  planId: z.string().optional(),
  routes: z.array(routeOptionSchema),
  alternatives: z.array(routeOptionSchema).optional(),
  graphSource: z.string(),
  isLiveEvidence: z.literal(false),
});

export const barrierReportSchema = z.object({
  segmentId: z.string(),
  type: z.enum([
    "blocked_path",
    "lift_outage",
    "construction",
    "poor_surface",
    "missing_curb_ramp",
    "narrow_path",
    "unsafe_crossing",
    "other",
  ]),
  description: z.string().max(2000).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export type MobilityRoutingProfile = z.infer<typeof mobilityRoutingProfileSchema>;
export type PlanRouteRequest = z.infer<typeof planRouteRequestSchema>;
export type RouteOption = z.infer<typeof routeOptionSchema>;
export type PlanRouteResponse = z.infer<typeof planRouteResponseSchema>;
