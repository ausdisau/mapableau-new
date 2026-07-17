import { z } from "zod";

import { auraAuthorityLevelSchema } from "./authority/ladder";

export const auraModuleSchema = z.enum([
  "core_calendar",
  "care",
  "transport",
  "jobs",
  "access",
  "billing_summaries",
  "accessibility_profile",
  "access_passport",
  "supporter_context",
]);

export type AuraModule = z.infer<typeof auraModuleSchema>;

export const auraMissionStateSchema = z.enum([
  "draft",
  "collecting_context",
  "awaiting_participant_input",
  "retrieving_evidence",
  "evaluating",
  "ready_for_review",
  "awaiting_confirmation",
  "confirmed",
  "in_progress",
  "disrupted",
  "completed",
  "cancelled",
  "stopped",
  "human_review_required",
]);

export type AuraMissionState = z.infer<typeof auraMissionStateSchema>;

export const auraMissionNodeTypeSchema = z.enum([
  "goal",
  "appointment",
  "care_support",
  "transport",
  "curb_or_dropoff",
  "place",
  "entrance",
  "internal_destination",
  "access_requirement",
  "evidence",
  "incident",
  "unknown",
  "supporter",
  "worker",
  "employer",
  "action_proposal",
  "fallback",
  "human_review",
]);

export const auraMissionEdgeTypeSchema = z.enum([
  "requires",
  "supports",
  "depends_on",
  "validated_by",
  "blocked_by",
  "made_uncertain_by",
  "alternative_to",
  "requires_approval",
  "requires_human_review",
]);

export const auraMissionGraphNodeSchema = z.object({
  id: z.string(),
  type: auraMissionNodeTypeSchema,
  label: z.string(),
  status: z.enum(["ok", "unknown", "blocked", "optional"]).default("ok"),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const auraMissionGraphEdgeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  type: auraMissionEdgeTypeSchema,
});

export const auraMissionGraphSchema = z.object({
  nodes: z.array(auraMissionGraphNodeSchema),
  edges: z.array(auraMissionGraphEdgeSchema),
});

export type AuraMissionGraph = z.infer<typeof auraMissionGraphSchema>;

export const auraCapabilityIdSchema = z.enum([
  "access.read_place_evidence",
  "access.read_passport",
  "access.calculate_fit",
  "access.build_route",
  "access.counterfactuals",
  "calendar.read_appointments",
  "transport.read_options",
  "care.read_summary",
  "jobs.read_interview_context",
  "plan.build_proof",
  "plan.verify",
  "plan.challenge",
  "mission.read",
  "mission.stop",
  "proposal.create",
  "proposal.verify",
  "proposal.review",
  "proposal.shadow",
  "proposal.venue_verification",
  "proposal.visit_plan_share",
  "proposal.supporter_notification",
  "proposal.transport_request",
  "proposal.barrier_report",
]);

export type AuraCapabilityId = z.infer<typeof auraCapabilityIdSchema>;

export const auraLeaseAuthoritySchema = z.enum([
  "read",
  "explain",
  "recommend",
  "propose",
]);

export const auraCapabilityLeaseSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  userId: z.string(),
  module: auraModuleSchema,
  capabilityId: auraCapabilityIdSchema,
  authority: auraLeaseAuthoritySchema,
  authorityLevel: auraAuthorityLevelSchema,
  resourceScope: z.array(z.string()),
  fieldScope: z.array(z.string()),
  issuedAt: z.string(),
  expiresAt: z.string(),
  revokedAt: z.string().nullable(),
  revocationReason: z.string().nullable(),
  correlationId: z.string(),
});

export type AuraCapabilityLease = z.infer<typeof auraCapabilityLeaseSchema>;

export const auraProofPlanStatusSchema = z.enum([
  "suitable",
  "suitable_with_conditions",
  "blocked",
  "unknown",
]);

export const auraAccessibleRouteSchema = z.object({
  id: z.string(),
  placeId: z.string(),
  summary: z.string(),
  entranceId: z.string().optional(),
  entranceLabel: z.string().optional(),
  liftId: z.string().optional(),
  liftLabel: z.string().optional(),
  stepIds: z.array(z.string()).default([]),
  engineVersion: z.string(),
  deterministic: z.literal(true),
});

export const auraProofPlanSchema = z.object({
  id: z.string(),
  missionId: z.string(),
  goal: z.string(),
  status: auraProofPlanStatusSchema,
  participantRequirements: z.array(
    z.object({
      requirementId: z.string(),
      featureType: z.string(),
      importance: z.enum(["required", "preferred", "helpful"]),
    }),
  ),
  evidence: z.array(
    z.object({
      evidenceId: z.string(),
      claimId: z.string().optional(),
      sourceType: z.string(),
      observedAt: z.string(),
      confidence: z.number(),
    }),
  ),
  deterministicDecisions: z.array(
    z.object({
      engine: z.string(),
      version: z.string(),
      resultReference: z.string(),
    }),
  ),
  assumptions: z.array(z.string()),
  unknowns: z.array(z.string()),
  blockers: z.array(z.string()),
  conditions: z.array(z.string()),
  recommendedRoute: auraAccessibleRouteSchema.optional(),
  rejectedAlternatives: z.array(
    z.object({
      label: z.string(),
      reasons: z.array(z.string()),
    }),
  ),
  counterfactuals: z.array(
    z.object({
      changedCondition: z.string(),
      result: z.string(),
    }),
  ),
  proposedActions: z.array(z.unknown()).default([]),
  authority: z.object({
    maximumLevel: z.string(),
    userApprovalRequired: z.boolean(),
    venueApprovalRequired: z.boolean(),
  }),
  expiresAt: z.string(),
});

export type AuraProofPlan = z.infer<typeof auraProofPlanSchema>;

export const auraVerifierStatusSchema = z.enum([
  "verified",
  "verified_with_warnings",
  "rejected",
  "human_review_required",
]);

export type AuraVerifierStatus = z.infer<typeof auraVerifierStatusSchema>;

export const auraVerifierResultSchema = z.object({
  status: auraVerifierStatusSchema,
  findings: z.array(
    z.object({
      code: z.string(),
      severity: z.enum(["info", "warning", "error"]),
      message: z.string(),
    }),
  ),
  checkedAt: z.string(),
  verifierVersion: z.string(),
});

export type AuraVerifierResult = z.infer<typeof auraVerifierResultSchema>;

export const auraResponseSchema = z.object({
  missionId: z.string(),
  missionState: auraMissionStateSchema,
  goal: z.string(),
  authority: z.object({
    currentLevel: auraAuthorityLevelSchema,
    maximumLevel: auraAuthorityLevelSchema,
    activeCapabilityCount: z.number(),
    expiresAt: z.string().optional(),
  }),
  plan: auraProofPlanSchema.optional(),
  verifier: auraVerifierResultSchema.optional(),
  knownFacts: z.array(z.string()),
  unknowns: z.array(z.string()),
  blockers: z.array(z.string()),
  conditions: z.array(z.string()),
  alternatives: z.array(z.string()),
  missionGraph: auraMissionGraphSchema,
  missionGraphSummary: z.object({
    nodeCount: z.number(),
    dependencyCount: z.number(),
    unresolvedDependencyCount: z.number(),
  }),
  proposedActions: z.array(
    z.object({
      proposalId: z.string(),
      label: z.string(),
      actionType: z.string(),
      recipient: z.string().optional(),
      approvalRequired: z.boolean(),
      expiresAt: z.string(),
    }),
  ),
  humanReview: z.object({
    required: z.boolean(),
    reason: z.string().optional(),
  }),
  nonAiRoutes: z.array(
    z.object({
      label: z.string(),
      href: z.string(),
    }),
  ),
  modules: z.object({
    selected: z.array(auraModuleSchema),
    denied: z.array(auraModuleSchema),
    unavailable: z.array(auraModuleSchema),
    accessibilityProfileOptIn: z.boolean(),
  }),
  lastCheckedAt: z.string(),
  syntheticDemo: z.boolean().default(true),
});

export type AuraResponse = z.infer<typeof auraResponseSchema>;

export const createAuraMissionInputSchema = z.object({
  goal: z.string().min(3).max(2000),
  missionType: z.string().default("accessibility_journey"),
  selectedModules: z.array(auraModuleSchema).min(1),
  accessibilityProfileOptIn: z.boolean().default(false),
  selectedPassportId: z.string().optional(),
  placeId: z.string().default("place-harbour-civic"),
  scenarioId: z.string().optional(),
  freeText: z.string().optional(),
  userId: z.string().default("demo-participant-taylor"),
  tenantId: z.string().optional(),
});

export type CreateAuraMissionInput = z.input<
  typeof createAuraMissionInputSchema
>;
export type CreateAuraMissionParsed = z.output<
  typeof createAuraMissionInputSchema
>;
