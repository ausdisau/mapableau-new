import { z } from "zod";

import {
  accessDecisionSchema,
  accessFeatureSchema,
  accessPassportSchema,
  accessRequirementSchema,
  buildingElementSchema,
  evidenceSchema,
  liveIncidentSchema,
  placeSchema,
  routeEdgeSchema,
  routeNodeSchema,
} from "../schemas";

export const optimisationGoalSchema = z.enum([
  "shortest",
  "lowest_effort",
  "highest_confidence",
  "lowest_sensory_load",
]);

export const uncertaintyToleranceSchema = z.enum(["low", "moderate", "high"]);

export const journeyContextSchema = z.object({
  purpose: z.string().min(1),
  destination: z.string().min(1),
  visitAt: z.string().optional(),
  arrivalWindowMinutes: z.number().int().positive().optional(),
  currentMobilityAid: z.string().optional(),
  companionCount: z.number().int().min(0).default(0),
  supportWorkerPresent: z.boolean().default(false),
  assistanceAnimalPresent: z.boolean().default(false),
  optimisationGoal: optimisationGoalSchema.default("highest_confidence"),
  uncertaintyTolerance: uncertaintyToleranceSchema.default("moderate"),
  temporaryRequirements: z.array(accessRequirementSchema).default([]),
});

export const personalAccessTwinSchema = z.object({
  passport: accessPassportSchema,
  journeyContext: journeyContextSchema,
});

export const temporalRuleSchema = z.object({
  id: z.string(),
  placeId: z.string(),
  elementId: z.string().optional(),
  edgeIds: z.array(z.string()).default([]),
  ruleType: z.enum([
    "opening_hours",
    "scheduled_closure",
    "staff_availability",
    "event_layout",
    "maintenance_window",
    "lighting_condition",
  ]),
  /** Local hour 0–23 inclusive start (demo simplification). */
  closesAfterHourLocal: z.number().int().min(0).max(23).optional(),
  opensAtHourLocal: z.number().int().min(0).max(23).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  effect: z.object({
    available: z.boolean().optional(),
    note: z.string(),
  }),
});

export const livingAccessTwinSchema = z.object({
  place: placeSchema,
  elements: z.array(buildingElementSchema),
  features: z.array(accessFeatureSchema),
  evidence: z.array(evidenceSchema),
  nodes: z.array(routeNodeSchema),
  edges: z.array(routeEdgeSchema),
  incidents: z.array(liveIncidentSchema),
  operatingRules: z.array(temporalRuleSchema),
  destinations: z.array(
    z.object({
      id: z.string(),
      nodeId: z.string(),
      label: z.string(),
      level: z.string().optional(),
    }),
  ),
  version: z.string(),
  updatedAt: z.string(),
  fictionalNotice: z.string(),
});

export const venueMutationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  mutationType: z.enum([
    "change_measurement",
    "change_opening_hours",
    "repair_element",
    "remove_obstruction",
    "add_feature",
    "verify_unknown",
    "resolve_dispute",
    "add_staff_availability",
    "add_alternative_route",
    "improve_signage",
    "add_hearing_augmentation",
    "add_quiet_waiting_space",
  ]),
  targetElementId: z.string().optional(),
  targetFeatureType: z.string().optional(),
  targetEdgeIds: z.array(z.string()).optional(),
  targetIncidentId: z.string().optional(),
  targetRuleId: z.string().optional(),
  before: z.unknown().optional(),
  after: z.record(z.string(), z.unknown()),
  estimatedEffort: z.enum([
    "very_low",
    "low",
    "moderate",
    "high",
    "very_high",
  ]),
  estimatedCostBand: z
    .enum(["operational", "minor", "capital", "major_capital"])
    .optional(),
  evidenceRequiredAfterCompletion: z.array(z.string()),
});

export const counterfactualResultSchema = z.object({
  mutation: venueMutationSchema,
  beforeDecision: accessDecisionSchema,
  afterDecision: accessDecisionSchema,
  statusChanged: z.boolean(),
  newlyEligibleRoutes: z.array(z.string()),
  resolvedUnknowns: z.array(z.string()),
  remainingBlockers: z.array(z.string()),
  explanation: z.string(),
  rankingFactors: z.object({
    statusImprovement: z.number(),
    journeysImproved: z.number(),
    evidenceConfidenceDelta: z.number(),
    effortScore: z.number(),
  }),
});

export const learningTraceEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("prediction_submitted"),
    status: z.enum(["suitable", "suitable_with_conditions", "blocked", "unknown"]),
    confidence: z.number(),
    timestamp: z.string(),
  }),
  z.object({
    type: z.literal("evidence_opened"),
    evidenceId: z.string(),
    timestamp: z.string(),
  }),
  z.object({
    type: z.literal("route_selected"),
    routeId: z.string(),
    timestamp: z.string(),
  }),
  z.object({
    type: z.literal("hint_requested"),
    hintLevel: z.number(),
    timestamp: z.string(),
  }),
  z.object({
    type: z.literal("decision_revised"),
    status: z.enum(["suitable", "suitable_with_conditions", "blocked", "unknown"]),
    confidence: z.number(),
    timestamp: z.string(),
  }),
  z.object({
    type: z.literal("unknown_classified"),
    featureType: z.string(),
    classification: z.enum(["unknown", "absent", "present"]),
    timestamp: z.string(),
  }),
]);

export type JourneyContext = z.infer<typeof journeyContextSchema>;
export type PersonalAccessTwin = z.infer<typeof personalAccessTwinSchema>;
export type TemporalRule = z.infer<typeof temporalRuleSchema>;
export type LivingAccessTwin = z.infer<typeof livingAccessTwinSchema>;
export type VenueMutation = z.infer<typeof venueMutationSchema>;
export type CounterfactualResult = z.infer<typeof counterfactualResultSchema>;
export type LearningTraceEvent = z.infer<typeof learningTraceEventSchema>;
