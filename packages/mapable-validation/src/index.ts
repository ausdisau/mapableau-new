import { z } from "zod";

export const opaqueIdSchema = z.string().min(1).max(128);
export const isoDateTimeSchema = z.string().datetime();
export const idempotencyKeySchema = z.string().uuid();

export const operationalStatusSchema = z.enum([
  "needs_decision",
  "waiting_on_others",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "recovery_required",
]);

export const evidenceProvenanceSchema = z.enum([
  "professional_assessment",
  "mapable_accreditation",
  "community_report",
  "provider_claim",
  "public_record",
  "participant_experience",
  "ai_inference",
  "unknown",
]);

export const authorityKindSchema = z.enum([
  "authenticated_identity",
  "organisation_membership",
  "application_permission",
  "participant_authority",
  "financial_authority",
  "clinical_authority",
]);

export const appRoleSchema = z.enum([
  "participant",
  "participant_delegate",
  "support_worker",
  "support_coordinator",
  "provider_staff",
  "transport_operator",
  "plan_manager",
  "employer",
  "clinician",
  "platform_administrator",
]);

export type AppRole = z.infer<typeof appRoleSchema>;
export type EvidenceProvenance = z.infer<typeof evidenceProvenanceSchema>;
export type AuthorityKind = z.infer<typeof authorityKindSchema>;
