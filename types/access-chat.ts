import { z } from "zod";

export const mobilityAidSchema = z.enum([
  "manual_wheelchair",
  "powerchair",
  "scooter",
  "walker",
  "cane",
  "none",
]);

export const rampToleranceSchema = z.enum(["none", "gentle", "moderate"]);

export const requiredFeaturesSchema = z.object({
  stepFreeAccess: z.boolean().optional(),
  accessibleToilet: z.boolean().optional(),
  accessibleParking: z.boolean().optional(),
  quietSpace: z.boolean().optional(),
  hearingLoop: z.boolean().optional(),
  serviceAnimalFriendly: z.boolean().optional(),
  lowSensory: z.boolean().optional(),
  accessibleDropoff: z.boolean().optional(),
});

export const userContextSchema = z.object({
  mobilityAid: mobilityAidSchema.optional(),
  maxDistanceMeters: z.number().min(50).max(100_000).optional(),
  avoidCrowds: z.boolean().optional(),
  rampTolerance: rampToleranceSchema.optional(),
  needsSupportPerson: z.boolean().optional(),
});

export const accessSearchIntentSchema = z.object({
  query: z.string().min(1).max(2000),
  location: z
    .object({
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional(),
      suburb: z.string().max(120).optional(),
      radiusMeters: z.number().min(100).max(100_000).optional(),
    })
    .optional(),
  categories: z.array(z.string()).optional(),
  requiredFeatures: requiredFeaturesSchema.default({}),
  userContext: userContextSchema.optional(),
});

export type AccessSearchIntent = z.infer<typeof accessSearchIntentSchema>;

export const fitLabelSchema = z.enum([
  "likely_suitable",
  "suitable_with_caution",
  "not_enough_information",
  "likely_unsuitable",
]);

export const accessSearchResultSchema = z.object({
  placeId: z.string(),
  name: z.string(),
  category: z.string(),
  address: z.string(),
  distanceMeters: z.number().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  fit: z.object({
    label: fitLabelSchema,
    score: z.number(),
    confidence: z.number().min(0).max(1),
    reasons: z.array(z.string()),
    cautions: z.array(z.string()),
  }),
  accessSummary: z.object({
    overallScore: z.number(),
    mobilityScore: z.number().optional(),
    toiletScore: z.number().optional(),
    sensoryScore: z.number().optional(),
    communicationScore: z.number().optional(),
    staffServiceScore: z.number().optional(),
    lastVerifiedAt: z.string().optional(),
  }),
  evidence: z.object({
    latestComment: z.string().optional(),
    activeAlerts: z.array(z.string()).optional(),
    verifiedByCommunityCount: z.number().optional(),
    photosAvailable: z.boolean().optional(),
  }),
  actions: z.object({
    openMarkerUrl: z.string(),
    planTransportUrl: z.string().optional(),
    addReportUrl: z.string().optional(),
  }),
});

export type AccessSearchResult = z.infer<typeof accessSearchResultSchema>;

export const accessChatMessageRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().max(120).optional(),
  intentOverride: accessSearchIntentSchema.optional(),
  /** Client asserts user consented to attach access profile fields. */
  shareAccessProfile: z.boolean().optional(),
  userContext: userContextSchema.optional(),
  locationHint: z
    .object({
      lat: z.number().optional(),
      lng: z.number().optional(),
      suburb: z.string().optional(),
    })
    .optional(),
});

export type AccessChatMessageRequest = z.infer<
  typeof accessChatMessageRequestSchema
>;

export const accessChatFeedbackSchema = z.object({
  sessionId: z.string().max(120),
  messageId: z.string().max(120).optional(),
  rating: z.enum(["up", "down", "refine"]),
  comment: z.string().max(2000).optional(),
  intentSnapshot: z.record(z.string(), z.unknown()).optional(),
});

export const accessibleTripFromSearchSchema = z.object({
  placeId: z.string().min(1),
  destination: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  preferredEntrance: z.string().max(500).optional(),
  accessibleDropoff: z
    .object({
      lat: z.number().optional(),
      lng: z.number().optional(),
      note: z.string().max(500).optional(),
    })
    .optional(),
  activeWarnings: z.array(z.string()).optional(),
  accessScore: z.number().optional(),
  confidenceScore: z.number().optional(),
  userAccessProfile: userContextSchema.optional(),
  shareAccessProfile: z.boolean().optional(),
});
