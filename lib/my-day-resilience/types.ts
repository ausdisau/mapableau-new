import { z } from "zod";

/** Honesty labels for every evidence artifact (P07). */
export const evidenceHonestySchema = z.enum([
  "fictional",
  "unknown",
  "declared",
  "verified",
]);
export type EvidenceHonesty = z.infer<typeof evidenceHonestySchema>;

export const capabilityClaimSchema = z.enum([
  "verified_live",
  "implemented_not_independently_verified",
  "in_development",
  "proposed",
  "exploratory",
  "historical",
]);
export type CapabilityClaim = z.infer<typeof capabilityClaimSchema>;

export const journeyPhaseSchema = z.enum([
  "consent_gate",
  "plan_edit",
  "dependency_eval",
  "scenario_ready",
  "disruption_injected",
  "recovery_options",
  "participant_approved",
  "human_escalation",
  "receipt_issued",
  "replay_ready",
  "blocked",
]);
export type JourneyPhase = z.infer<typeof journeyPhaseSchema>;

export const userDecisionKindSchema = z.enum([
  "accept",
  "decline",
  "defer",
  "edit",
  "revoke",
  "request_human_help",
  "withdraw_preference",
]);
export type UserDecisionKind = z.infer<typeof userDecisionKindSchema>;

export const communicationNeedSchema = z.enum([
  "aac",
  "extra_time",
  "auslan",
  "spoken",
]);
export type CommunicationNeed = z.infer<typeof communicationNeedSchema>;

export const sourceEvidenceSchema = z.object({
  id: z.string(),
  topic: z.string(),
  honesty: evidenceHonestySchema,
  summary: z.string(),
  capabilityClaim: capabilityClaimSchema.default("in_development"),
});
export type SourceEvidence = z.infer<typeof sourceEvidenceSchema>;

export const consentSnapshotSchema = z.object({
  granted: z.boolean(),
  purpose: z.literal("my_day_resilience_synthetic_demo"),
  tenantId: z.string(),
  participantSyntheticId: z.string(),
  recordedAt: z.string(),
  withdrawnAt: z.string().optional(),
});
export type ConsentSnapshot = z.infer<typeof consentSnapshotSchema>;

export const planStepKindSchema = z.enum([
  "work",
  "shops",
  "return_home",
  "care_support",
  "transport_leg",
]);
export type PlanStepKind = z.infer<typeof planStepKindSchema>;

export const planStepSchema = z.object({
  id: z.string(),
  kind: planStepKindSchema,
  label: z.string(),
  scheduledStart: z.string(),
  scheduledEnd: z.string(),
  destinationLabel: z.string(),
  supportNeeded: z.boolean(),
  preferredWorkerId: z.string().optional(),
  transportRequired: z.boolean(),
  communicationNeeds: z.array(communicationNeedSchema),
  mobilityNotes: z.string().optional(),
});
export type PlanStep = z.infer<typeof planStepSchema>;

export const stepDependencySchema = z.object({
  id: z.string(),
  fromStepId: z.string(),
  toStepId: z.string(),
  relation: z.enum(["requires", "enables", "timed_before", "recovers"]),
  honesty: evidenceHonestySchema,
});
export type StepDependency = z.infer<typeof stepDependencySchema>;

export const myDayPlanSchema = z.object({
  planId: z.string(),
  tenantId: z.string(),
  participantSyntheticId: z.string(),
  goalStatement: z.string(),
  steps: z.array(planStepSchema),
  dependencies: z.array(stepDependencySchema),
  synthetic: z.literal(true),
  productionClaim: z.literal("none"),
});
export type MyDayPlan = z.infer<typeof myDayPlanSchema>;

export const proposalSchema = z.object({
  id: z.string(),
  kind: z.enum([
    "preserve_arrangement",
    "substitute_worker",
    "alternate_transport",
    "defer_activity",
    "human_coordination",
  ]),
  label: z.string(),
  explanation: z.string(),
  evidence: z.array(sourceEvidenceSchema),
  /** Never true for live bookings — scenario verification only. */
  verifiedInScenario: z.boolean(),
  canExecute: z.literal(false),
  requiresParticipantApproval: z.literal(true),
  humanReviewRequired: z.boolean(),
});
export type Proposal = z.infer<typeof proposalSchema>;

export const userDecisionSchema = z.object({
  id: z.string(),
  kind: userDecisionKindSchema,
  proposalId: z.string().optional(),
  note: z.string().optional(),
  at: z.string(),
});
export type UserDecision = z.infer<typeof userDecisionSchema>;

export const scenarioEventSchema = z.object({
  seq: z.number().int().nonnegative(),
  id: z.string(),
  type: z.string(),
  at: z.string(),
  tenantId: z.string(),
  payload: z.record(z.string(), z.unknown()),
  immutable: z.literal(true),
});
export type ScenarioEvent = z.infer<typeof scenarioEventSchema>;

export const decisionReceiptSchema = z.object({
  receiptId: z.string(),
  planId: z.string(),
  tenantId: z.string(),
  phase: journeyPhaseSchema,
  decisions: z.array(userDecisionSchema),
  chosenProposalId: z.string().optional(),
  rejectedProposalIds: z.array(z.string()),
  evidence: z.array(sourceEvidenceSchema),
  escalationReason: z.string().optional(),
  noOperationalChangeMade: z.literal(true),
  canBook: z.literal(false),
  productionClaim: z.literal("none"),
  issuedAt: z.string(),
  explainability: z.array(z.string()),
});
export type DecisionReceipt = z.infer<typeof decisionReceiptSchema>;

export const replayCursorSchema = z.object({
  planId: z.string(),
  eventSeq: z.number().int().nonnegative(),
  phase: journeyPhaseSchema,
});
export type ReplayCursor = z.infer<typeof replayCursorSchema>;

export type JourneyBlockReason =
  | "consent_denied"
  | "consent_withdrawn"
  | "cross_tenant"
  | "irreversible_blocked"
  | "no_verified_option";
