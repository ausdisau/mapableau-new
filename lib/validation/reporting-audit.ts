import { z } from "zod";

export const auditRiskLevelSchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

export const auditOutcomeSchema = z.enum([
  "success",
  "denied",
  "partial",
  "error",
]);

export const sensitivityLevelSchema = z.enum([
  "public",
  "internal",
  "confidential",
  "restricted",
]);

export const dataAccessResultSchema = z.enum(["allowed", "denied"]);

export const reportCategorySchema = z.enum([
  "participant_activity",
  "provider_operations",
  "care_delivery",
  "transport_delivery",
  "employment_outcomes",
  "marketplace_activity",
  "food_delivery",
  "billing_finance",
  "plan_manager_review",
  "quality_safeguards",
  "privacy_security",
  "peer_community",
  "access_map",
  "board_pack",
]);

export const reportExportFormatSchema = z.enum(["csv", "pdf", "json"]);

export const logAuditEventSchema = z.object({
  actorUserId: z.string().optional().nullable(),
  actorRole: z.string().optional().nullable(),
  organisationId: z.string().optional().nullable(),
  action: z.string().min(1),
  domain: z.string().optional().nullable(),
  entityType: z.string().min(1),
  entityId: z.string().optional().nullable(),
  participantId: z.string().optional().nullable(),
  providerId: z.string().optional().nullable(),
  beforeJson: z.record(z.string(), z.unknown()).optional().nullable(),
  afterJson: z.record(z.string(), z.unknown()).optional().nullable(),
  riskLevel: auditRiskLevelSchema.optional(),
  outcome: auditOutcomeSchema.optional(),
  reason: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  requestId: z.string().optional().nullable(),
  correlationId: z.string().optional().nullable(),
});

export const logDataAccessSchema = z.object({
  actorUserId: z.string().optional().nullable(),
  actorRole: z.string().optional().nullable(),
  organisationId: z.string().optional().nullable(),
  entityType: z.string().min(1),
  entityId: z.string().optional().nullable(),
  participantId: z.string().optional().nullable(),
  sensitivityLevel: sensitivityLevelSchema.optional(),
  consentGrantId: z.string().optional().nullable(),
  accessReason: z.string().optional().nullable(),
  result: dataAccessResultSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const emitDomainEventSchema = z.object({
  domain: z.string().min(1),
  eventType: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  participantId: z.string().optional().nullable(),
  organisationId: z.string().optional().nullable(),
  actorUserId: z.string().optional().nullable(),
  summary: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  correlationId: z.string().optional().nullable(),
});

export const runReportSchema = z.object({
  reportKey: z.string().min(1),
  organisationId: z.string().optional().nullable(),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export const exportReportSchema = z.object({
  reportRunId: z.string().min(1),
  format: reportExportFormatSchema.default("csv"),
  purpose: z.string().min(1),
});

export const createBreachSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  discoveredAt: z.string().min(1),
  notifiable: z.boolean().optional(),
});

export const updateBreachSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z
    .enum(["draft", "investigating", "notifiable", "closed"])
    .optional(),
  reportedAt: z.string().optional().nullable(),
  notifiable: z.boolean().optional(),
  remediationNotes: z.string().optional().nullable(),
});

export type LogAuditEventInput = z.infer<typeof logAuditEventSchema>;
export type LogDataAccessInput = z.infer<typeof logDataAccessSchema>;
export type EmitDomainEventInput = z.infer<typeof emitDomainEventSchema>;
export type RunReportInput = z.infer<typeof runReportSchema>;
export type ExportReportInput = z.infer<typeof exportReportSchema>;
