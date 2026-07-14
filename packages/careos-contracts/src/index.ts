import { z } from "zod";
import {
  evidenceProvenanceSchema,
  idempotencyKeySchema,
  isoDateTimeSchema,
  opaqueIdSchema,
  operationalStatusSchema,
} from "@mapable/validation";

export const careosMissionTypeSchema = z.enum([
  "appointment",
  "care",
  "transport",
  "coordination",
  "continuity_recovery",
  "other",
]);

export const careosMissionSummarySchema = z.object({
  id: opaqueIdSchema,
  missionType: careosMissionTypeSchema,
  status: operationalStatusSchema,
  desiredOutcome: z.string().min(1).max(500),
  whatChanged: z.string().min(1),
  whyItMatters: z.string().min(1),
  needsDecision: z.boolean(),
  whoIsWaiting: z.string().nullable(),
  whatHappensNext: z.string().min(1),
  updatedAt: isoDateTimeSchema,
}).strict();

export const careosUncertaintySchema = z.object({
  id: opaqueIdSchema,
  description: z.string().min(1),
  impact: z.enum(["timing", "care", "transport", "access", "cost", "authority", "other"]),
}).strict();

export const careosEvidenceItemSchema = z.object({
  id: opaqueIdSchema,
  label: z.string().min(1),
  provenance: evidenceProvenanceSchema,
  observedAt: isoDateTimeSchema.nullable(),
  confidence: z.enum(["high", "medium", "low", "unknown"]),
  summary: z.string().min(1),
}).strict();

export const careosPendingConfirmationSchema = z.object({
  id: opaqueIdSchema,
  domain: z.enum(["care", "transport"]),
  label: z.string().min(1),
  status: z.enum(["required", "granted", "declined"]),
  explanation: z.string().min(1),
}).strict();

export const careosActionReceiptSchema = z.object({
  id: opaqueIdSchema,
  domain: z.enum(["care", "transport", "other"]),
  action: z.string().min(1),
  confirmedAt: isoDateTimeSchema,
  correlationId: opaqueIdSchema,
}).strict();

export const careosMissionDetailSchema = careosMissionSummarySchema.extend({
  authoritySummary: z.string().min(1),
  unknownInformation: z.array(z.string()),
  recommendations: z.array(z.string()),
  humanReviewItems: z.array(z.string()),
  evidence: z.array(careosEvidenceItemSchema),
  uncertainties: z.array(careosUncertaintySchema),
  pendingConfirmations: z.array(careosPendingConfirmationSchema),
  receipts: z.array(careosActionReceiptSchema),
  dependencyLabels: z.array(z.string()),
  nonAiPathwayAvailable: z.boolean(),
  appointment: z
    .object({
      title: z.string(),
      startsAt: isoDateTimeSchema.nullable(),
      locationLabel: z.string().nullable(),
      careRequirements: z.array(z.string()),
      transportOptionsSummary: z.array(z.string()),
      accessEvidenceSummary: z.array(z.string()),
      timingBuffers: z.array(z.string()),
      costContext: z.string().nullable(),
    })
    .nullable(),
}).strict();

export const createAppointmentMissionRequestSchema = z.object({
  goalText: z.string().min(3).max(500),
  idempotencyKey: idempotencyKeySchema,
  preferredLocale: z.string().optional(),
}).strict();

export const confirmMissionActionRequestSchema = z.object({
  confirmationId: opaqueIdSchema,
  domain: z.enum(["care", "transport"]),
  decision: z.enum(["grant", "decline"]),
  idempotencyKey: idempotencyKeySchema,
}).strict();

export type CareOSMissionSummary = z.infer<typeof careosMissionSummarySchema>;
export type CareOSMissionDetail = z.infer<typeof careosMissionDetailSchema>;
export type CreateAppointmentMissionRequest = z.infer<
  typeof createAppointmentMissionRequestSchema
>;
export type ConfirmMissionActionRequest = z.infer<
  typeof confirmMissionActionRequestSchema
>;
