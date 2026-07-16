/**
 * Physical Systems Zod schemas (zod 4) and inferred TypeScript types.
 */
import { z } from "zod";

import {
  accessDecisionSchema,
  accessibleRouteSchema,
} from "../schemas";

export const physicalActionRiskSchema = z.enum([
  "read_only",
  "low_risk_actuation",
  "supervised_actuation",
  "high_risk_actuation",
  "prohibited",
]);

export const deviceCapabilityKindSchema = z.enum([
  "call_lift",
  "open_authorised_door",
  "set_room_accessibility",
  "request_staff_assistance",
  "dispatch_simulated_robot_escort",
  "observe_environment",
  "other",
]);

export const deviceConditionSchema = z.enum([
  "normal",
  "degraded",
  "fault",
  "outage",
  "obstructed",
  "unknown",
  "emergency",
]);

export const deviceHealthStateSchema = z.enum([
  "healthy",
  "degraded",
  "unhealthy",
  "offline",
  "unknown",
]);

export const deviceStateSchema = z.object({
  deviceId: z.string().min(1),
  placeId: z.string().min(1),
  label: z.string().min(1),
  kind: z.string().min(1),
  health: deviceHealthStateSchema,
  condition: deviceConditionSchema,
  online: z.boolean(),
  lastObservedAt: z.string(),
  fictional: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const emergencyModeStateSchema = z.object({
  active: z.boolean(),
  reason: z.string().optional(),
  activatedAt: z.string().optional(),
  source: z.enum(["simulator", "venue", "system"]).optional(),
});

export const approvalKindSchema = z.enum([
  "user",
  "venue",
  "operator",
  "system",
]);

export const approvalRecordSchema = z.object({
  id: z.string().min(1),
  kind: approvalKindSchema,
  actorId: z.string().min(1),
  approvedAt: z.string(),
  expiresAt: z.string().optional(),
  note: z.string().optional(),
});

export const physicalActionStateSchema = z.enum([
  "proposed",
  "awaiting_user_approval",
  "awaiting_venue_approval",
  "approved",
  "executing",
  "verifying",
  "succeeded",
  "failed",
  "cancelled",
  "timed_out",
  "rolled_back",
]);

export const deviceCapabilitySchema = z.object({
  id: z.string().min(1),
  placeId: z.string().min(1),
  deviceId: z.string().min(1),
  actionType: z.string().min(1),
  kind: deviceCapabilityKindSchema,
  label: z.string().min(1),
  description: z.string(),
  risk: physicalActionRiskSchema,
  enabled: z.boolean(),
  requireUserApproval: z.boolean().default(true),
  requireVenueApproval: z.boolean().default(false),
  requireEmergencyModeOff: z.boolean().default(true),
  simulatedOnly: z.boolean().default(true),
  clearlySimulated: z.boolean().default(true),
  fictionalNotice: z.string().optional(),
  disabledReason: z.string().optional(),
  timeoutMs: z.number().int().positive().default(15_000),
  postconditions: z.array(z.string()).default([]),
});

export const fallbackPlanSchema = z.object({
  id: z.string().min(1),
  summary: z.string().min(1),
  steps: z.array(z.string()),
  alternateCapabilityIds: z.array(z.string()).default([]),
  requestStaff: z.boolean().default(false),
});

export const physicalActionProposalSchema = z.object({
  id: z.string().min(1),
  placeId: z.string().min(1),
  userId: z.string().min(1),
  capabilityId: z.string().min(1),
  deviceId: z.string().min(1),
  actionType: z.string().min(1),
  risk: physicalActionRiskSchema,
  rationale: z.string(),
  parameters: z.record(z.string(), z.unknown()).default({}),
  requireUserApproval: z.boolean(),
  requireVenueApproval: z.boolean(),
  requireEmergencyModeOff: z.boolean(),
  simulatedOnly: z.boolean(),
  clearlySimulated: z.boolean(),
  fallback: fallbackPlanSchema.optional(),
  proposalHash: z.string().min(1),
  createdAt: z.string(),
  expiresAt: z.string(),
  fictionalNotice: z
    .string()
    .default(
      "Fictional / simulated physical action for Access Intelligence demonstration.",
    ),
});

export const physicalActionExecutionSchema = z.object({
  id: z.string().min(1),
  proposal: physicalActionProposalSchema,
  state: physicalActionStateSchema,
  approvals: z.array(approvalRecordSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  adapterAck: z.string().optional(),
  postconditionResults: z
    .array(
      z.object({
        check: z.string(),
        passed: z.boolean(),
        detail: z.string().optional(),
      }),
    )
    .default([]),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  safetyReasons: z.array(z.string()).default([]),
});

export const environmentObservationSchema = z.object({
  id: z.string().min(1),
  placeId: z.string().min(1),
  subjectId: z.string().min(1),
  subjectKind: z.enum(["device", "element", "corridor", "room", "place"]),
  summary: z.string(),
  condition: deviceConditionSchema,
  observedAt: z.string(),
  source: z.enum(["simulator", "sensor", "staff", "community", "system"]),
  confidence: z.number().min(0).max(1),
  fictional: z.boolean().default(true),
});

export const sensorReadingSchema = z.object({
  id: z.string().min(1),
  deviceId: z.string().min(1),
  metric: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]),
  unit: z.string().optional(),
  observedAt: z.string(),
  fictional: z.boolean().default(true),
});

export const perceptionCandidateSchema = z.object({
  id: z.string().min(1),
  fixtureId: z.string().min(1),
  label: z.string().min(1),
  category: z.enum([
    "obstruction",
    "signage",
    "door_state",
    "lift_indicator",
    "lighting",
    "crowd",
    "surface",
    "other",
  ]),
  confidence: z.number().min(0).max(1),
  boundingBox: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  summary: z.string(),
  simulated: z.literal(true),
  fictionalNotice: z.string(),
});

export const physicalAccessResponseSchema = z.object({
  placeId: z.string(),
  mode: z.enum(["demo", "shadow", "supervised", "live"]),
  decision: accessDecisionSchema,
  route: accessibleRouteSchema.nullable(),
  fallbackRoute: accessibleRouteSchema.nullable(),
  availableCapabilities: z.array(deviceCapabilitySchema),
  devices: z.array(deviceStateSchema),
  emergency: emergencyModeStateSchema,
  observations: z.array(environmentObservationSchema).default([]),
  fictionalNotice: z.string(),
  generatedAt: z.string(),
});

export const safetyDecisionSchema = z.object({
  allowed: z.boolean(),
  code: z.string().optional(),
  reasons: z.array(z.string()),
  requireUserApproval: z.boolean(),
  requireVenueApproval: z.boolean(),
  fallbackSuggested: z.boolean().default(false),
});

export type PhysicalActionRisk = z.infer<typeof physicalActionRiskSchema>;
export type DeviceCapabilityKind = z.infer<typeof deviceCapabilityKindSchema>;
export type DeviceCondition = z.infer<typeof deviceConditionSchema>;
export type DeviceHealthState = z.infer<typeof deviceHealthStateSchema>;
export type DeviceState = z.infer<typeof deviceStateSchema>;
export type EmergencyModeState = z.infer<typeof emergencyModeStateSchema>;
export type ApprovalRecord = z.infer<typeof approvalRecordSchema>;
export type PhysicalActionState = z.infer<typeof physicalActionStateSchema>;
export type DeviceCapability = z.infer<typeof deviceCapabilitySchema>;
export type FallbackPlan = z.infer<typeof fallbackPlanSchema>;
export type PhysicalActionProposal = z.infer<typeof physicalActionProposalSchema>;
export type PhysicalActionExecution = z.infer<
  typeof physicalActionExecutionSchema
>;
export type EnvironmentObservation = z.infer<typeof environmentObservationSchema>;
export type SensorReading = z.infer<typeof sensorReadingSchema>;
export type PerceptionCandidate = z.infer<typeof perceptionCandidateSchema>;
export type PhysicalAccessResponse = z.infer<typeof physicalAccessResponseSchema>;
export type SafetyDecision = z.infer<typeof safetyDecisionSchema>;
