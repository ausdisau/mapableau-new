import { z } from "zod";

/** Importance of an access requirement. Required acts as a hard gate. */
export const importanceSchema = z.enum(["required", "preferred", "helpful"]);

export const operatorSchema = z.enum([
  "equals",
  "minimum",
  "maximum",
  "includes",
  "available",
]);

export const featureTypeSchema = z.enum([
  "step_free",
  "clear_door_width_mm",
  "turning_circle_mm",
  "gradient_ratio",
  "lift",
  "accessible_toilet",
  "changing_places",
  "adult_change_table",
  "seating_interval_m",
  "low_glare_lighting",
  "quiet_waiting_area",
  "hearing_augmentation",
  "captions",
  "tactile_wayfinding",
  "audio_wayfinding",
  "assistance_animal_access",
  "plain_language_instructions",
  "staff_assistance",
  "preferred_communication_mode",
  "companion_or_support_worker",
  "surface_type",
  "corridor_width_mm",
  "lift_door_width_mm",
]);

export const sourceTypeSchema = z.enum([
  "qualified_assessor",
  "system_feed",
  "trusted_partner",
  "venue_attestation",
  "trained_mapper",
  "community_report",
  "ai_inference",
]);

export const evidenceTypeSchema = z.enum([
  "measurement",
  "photograph",
  "video",
  "document",
  "floor_plan",
  "venue_statement",
  "community_observation",
  "system_status",
]);

export const evidenceStatusSchema = z.enum([
  "verified",
  "provisional",
  "disputed",
  "expired",
]);

export const buildingElementTypeSchema = z.enum([
  "parking",
  "drop_off",
  "path",
  "entrance",
  "door",
  "reception",
  "corridor",
  "ramp",
  "lift",
  "stairs",
  "room",
  "toilet",
  "quiet_space",
  "service_counter",
  "exit",
]);

export const decisionStatusSchema = z.enum([
  "suitable",
  "suitable_with_conditions",
  "blocked",
  "unknown",
]);

export const confidenceLabelSchema = z.enum([
  "high",
  "moderate",
  "limited",
  "very limited",
]);

export const mobilityAidSchema = z.enum([
  "none",
  "manual_wheelchair",
  "power_chair",
  "scooter",
  "walking_frame",
  "cane",
  "crutches",
  "assistance_animal",
]);

export const communicationPreferenceSchema = z.enum([
  "spoken",
  "written",
  "plain_language",
  "auslan",
  "captions",
  "email",
  "phone",
  "in_person",
]);

export const accessRequirementSchema = z.object({
  id: z.string().min(1),
  featureType: featureTypeSchema,
  importance: importanceSchema,
  operator: operatorSchema,
  value: z.union([z.string(), z.number(), z.boolean()]),
  unit: z.string().optional(),
  notes: z.string().optional(),
  shareWithVenue: z.boolean().default(false),
});

export const sharingDefaultsSchema = z.object({
  shareRequiredWithVenue: z.boolean().default(false),
  sharePreferredWithVenue: z.boolean().default(false),
  shareHelpfulWithVenue: z.boolean().default(false),
  purpose: z.string().optional(),
  durationHours: z.number().int().positive().optional(),
});

export const accessPassportSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().min(1),
  requirements: z.array(accessRequirementSchema),
  communicationPreferences: z.array(communicationPreferenceSchema),
  mobilityAids: z.array(mobilityAidSchema),
  sharingDefaults: sharingDefaultsSchema,
  isDefault: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const placeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  category: z.string().min(1),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  operator: z.string().optional(),
  openingHours: z.string().optional(),
  baselineScore: z.number().min(0).max(100).nullable().optional(),
  accreditationTier: z.string().nullable().optional(),
  lastVerifiedAt: z.string().nullable().optional(),
});

export const buildingElementSchema = z.object({
  id: z.string().min(1),
  placeId: z.string().min(1),
  type: buildingElementTypeSchema,
  name: z.string().min(1),
  level: z.string().optional(),
  geometry: z.unknown().optional(),
});

export const accessFeatureSchema = z.object({
  id: z.string().min(1),
  placeId: z.string().min(1),
  elementId: z.string().min(1),
  featureType: featureTypeSchema,
  value: z.union([z.string(), z.number(), z.boolean()]),
  unit: z.string().optional(),
  sourceType: sourceTypeSchema,
  observedAt: z.string(),
  validUntil: z.string().optional(),
  evidenceIds: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  disputed: z.boolean().default(false),
  notes: z.string().optional(),
});

export const evidenceSchema = z.object({
  id: z.string().min(1),
  type: evidenceTypeSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  capturedAt: z.string(),
  sourceName: z.string().min(1),
  sourceType: sourceTypeSchema,
  uri: z.string().optional(),
  measurement: z
    .object({
      value: z.union([z.string(), z.number(), z.boolean()]),
      unit: z.string().optional(),
    })
    .optional(),
  calibrationConfirmed: z.boolean().optional(),
  status: evidenceStatusSchema,
});

export const routeNodeSchema = z.object({
  id: z.string().min(1),
  placeId: z.string().min(1),
  elementId: z.string().optional(),
  label: z.string().min(1),
  level: z.string().optional(),
  coordinates: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
  nodeType: z.string().min(1),
});

export const routeEdgeSchema = z.object({
  id: z.string().min(1),
  fromNodeId: z.string().min(1),
  toNodeId: z.string().min(1),
  distanceMetres: z.number().nonnegative(),
  widthMm: z.number().optional(),
  gradientRatio: z.number().optional(),
  crossSlope: z.number().optional(),
  surface: z.string().optional(),
  steps: z.number().int().nonnegative().default(0),
  handrails: z.boolean().optional(),
  lighting: z.string().optional(),
  noiseLevel: z.string().optional(),
  tactileGuidance: z.boolean().optional(),
  automaticDoor: z.boolean().optional(),
  temporaryBarrier: z.boolean().default(false),
  evidenceConfidence: z.number().min(0).max(1),
  liftAvailable: z.boolean().optional(),
});

export const liveIncidentSchema = z.object({
  id: z.string().min(1),
  placeId: z.string().min(1),
  elementId: z.string().optional(),
  type: z.enum([
    "lift_outage",
    "blocked_route",
    "locked_entrance",
    "toilet_unavailable",
    "construction",
    "automatic_door_fault",
    "crowding",
    "high_noise",
    "flooding",
    "other",
  ]),
  severity: z.enum(["low", "moderate", "high", "critical"]),
  description: z.string().min(1),
  sourceType: sourceTypeSchema,
  reportedAt: z.string(),
  confirmedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  status: z.enum(["active", "resolved", "expired", "unverified"]),
  affectedEdgeIds: z.array(z.string()).default([]),
});

export const matchExplanationSchema = z.object({
  requirementId: z.string(),
  featureType: featureTypeSchema,
  importance: importanceSchema,
  outcome: z.enum(["matched", "failed", "unknown", "condition"]),
  explanation: z.string(),
  evidenceIds: z.array(z.string()).default([]),
});

export const accessDecisionSchema = z.object({
  placeId: z.string(),
  status: decisionStatusSchema,
  baselineScore: z.number().nullable(),
  personalFit: z.number().nullable(),
  evidenceConfidence: z.number().min(0).max(100),
  evidenceConfidenceLabel: confidenceLabelSchema,
  liveReliability: z.number().min(0).max(100),
  blockers: z.array(z.string()),
  conditions: z.array(z.string()),
  unknowns: z.array(z.string()),
  matchedRequirements: z.array(matchExplanationSchema),
  alternatives: z.array(z.string()),
  evidenceIds: z.array(z.string()),
  recommendedRouteId: z.string().nullable(),
  generatedAt: z.string(),
});

export const routeStepSchema = z.object({
  order: z.number().int().nonnegative(),
  instruction: z.string(),
  nodeId: z.string().optional(),
  edgeId: z.string().optional(),
  level: z.string().optional(),
  evidenceConfidence: z.number().min(0).max(1).optional(),
  distanceMetres: z.number().optional(),
});

export const accessibleRouteSchema = z.object({
  id: z.string(),
  placeId: z.string(),
  fromLabel: z.string(),
  toLabel: z.string(),
  nodeIds: z.array(z.string()),
  edgeIds: z.array(z.string()),
  totalDistanceMetres: z.number(),
  estimatedAdditionalMinutes: z.number(),
  steps: z.array(routeStepSchema),
  segmentConfidence: z.array(
    z.object({
      edgeId: z.string(),
      confidence: z.number().min(0).max(1),
    }),
  ),
  cost: z.number(),
  rejectedAlternatives: z.array(
    z.object({
      summary: z.string(),
      reasons: z.array(z.string()),
    }),
  ),
});

export const visitPlanSchema = z.object({
  id: z.string(),
  userId: z.string(),
  placeId: z.string(),
  destination: z.string(),
  visitAt: z.string().optional(),
  accessDecision: accessDecisionSchema,
  route: accessibleRouteSchema.nullable(),
  arrivalInstructions: z.array(z.string()),
  contingencyInstructions: z.array(z.string()),
  evidenceSummary: z.array(z.string()),
  lastCheckedAt: z.string(),
});

export const agentAccessPlanSchema = z.object({
  placeId: z.string().nullable(),
  placeName: z.string().nullable(),
  destination: z.string().nullable(),
  visitAt: z.string().nullable(),
  status: decisionStatusSchema.nullable(),
  baselineScore: z.number().nullable(),
  personalFit: z.number().nullable(),
  evidenceConfidence: z.number().nullable(),
  liveReliability: z.number().nullable(),
  summary: z.string(),
  blockers: z.array(z.string()),
  conditions: z.array(z.string()),
  unknowns: z.array(z.string()),
  confirmedFeatures: z.array(z.string()),
  recommendedRoute: accessibleRouteSchema.nullable(),
  alternatives: z.array(z.string()),
  actions: z.array(
    z.object({
      type: z.string(),
      label: z.string(),
      description: z.string().optional(),
    }),
  ),
  evidenceIds: z.array(z.string()),
  lastCheckedAt: z.string(),
});

export const accessAuditEventSchema = z.object({
  id: z.string(),
  action: z.string(),
  actorUserId: z.string(),
  purpose: z.string().optional(),
  fieldsShared: z.array(z.string()).default([]),
  recipient: z.string().optional(),
  timestamp: z.string(),
  outcome: z.enum(["approved", "cancelled", "executed", "failed"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type Importance = z.infer<typeof importanceSchema>;
export type FeatureType = z.infer<typeof featureTypeSchema>;
export type SourceType = z.infer<typeof sourceTypeSchema>;
export type DecisionStatus = z.infer<typeof decisionStatusSchema>;
export type ConfidenceLabel = z.infer<typeof confidenceLabelSchema>;
export type AccessRequirement = z.infer<typeof accessRequirementSchema>;
export type AccessPassport = z.infer<typeof accessPassportSchema>;
export type Place = z.infer<typeof placeSchema>;
export type BuildingElement = z.infer<typeof buildingElementSchema>;
export type AccessFeature = z.infer<typeof accessFeatureSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type RouteNode = z.infer<typeof routeNodeSchema>;
export type RouteEdge = z.infer<typeof routeEdgeSchema>;
export type LiveIncident = z.infer<typeof liveIncidentSchema>;
export type AccessDecision = z.infer<typeof accessDecisionSchema>;
export type AccessibleRoute = z.infer<typeof accessibleRouteSchema>;
export type VisitPlan = z.infer<typeof visitPlanSchema>;
export type AgentAccessPlan = z.infer<typeof agentAccessPlanSchema>;
export type AccessAuditEvent = z.infer<typeof accessAuditEventSchema>;
export type MatchExplanation = z.infer<typeof matchExplanationSchema>;
