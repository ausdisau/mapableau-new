import { z } from "zod";

import { DATA_CLASSES } from "@/lib/ai/platform/types/classification";

export const SENTINEL_STATES = [
  "OBSERVING",
  "VERIFICATION_REQUIRED",
  "PAUSED",
  "PARTICIPANT_CONFIRMATION_REQUIRED",
  "HUMAN_REVIEW_REQUIRED",
  "COMPLAINT_HANDOFF",
  "INCIDENT_TRIAGE_HANDOFF",
  "RECOVERY_PROPOSED",
  "APPROVED_ACTION_PENDING",
  "CONTINUING",
  "RESOLVED",
  "STOPPED_BY_PARTICIPANT",
  "SECURITY_QUARANTINE",
  "DEGRADED",
  "FAILED_SAFE",
] as const;

export type SentinelState = (typeof SENTINEL_STATES)[number];

export const SENTINEL_POLICY_DISPOSITIONS = [
  "ALLOW",
  "ALLOW_WITH_CONDITIONS",
  "PAUSE",
  "PARTICIPANT_CONFIRMATION",
  "HUMAN_REVIEW",
  "COMPLAINT_HANDOFF",
  "INCIDENT_TRIAGE_HANDOFF",
  "DENY",
  "SECURITY_QUARANTINE",
] as const;

export type SentinelPolicyDisposition =
  (typeof SENTINEL_POLICY_DISPOSITIONS)[number];

export const sentinelEventEnvelopeSchema = z.object({
  eventId: z.string().uuid(),
  schemaVersion: z.number().int().positive(),
  domain: z.enum(["care", "transport", "employment", "shared"]),
  eventType: z.string().min(1),
  tenantId: z.string().min(1),
  subjectRef: z.string().min(1),
  participantRef: z.string().min(1).optional(),
  actorRef: z.string().min(1),
  purpose: z.string().min(1),
  authorityRef: z.string().min(1).optional(),
  consentRefs: z.array(z.string().min(1)).default([]),
  dataClasses: z.array(z.enum(DATA_CLASSES)),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  payloadRef: z.string().min(1).optional(),
  occurredAt: z.string().datetime(),
  source: z.string().min(1),
});

export type SentinelEventEnvelope = z.infer<typeof sentinelEventEnvelopeSchema>;

export type SentinelPolicyDecision = {
  disposition: SentinelPolicyDisposition;
  reasonCodes: string[];
  policyVersion: string;
  participantConfirmationRequired: boolean;
  humanReviewRequired: boolean;
};

export type SentinelCaseSnapshot = {
  caseId: string;
  domain: SentinelEventEnvelope["domain"];
  subjectRefs: string[];
  participantRef?: string;
  tenantId: string;
  state: SentinelState;
  reasonCodes: string[];
  policyVersion: string;
  openedAt: string;
  updatedAt: string;
  resolvedAt?: string;
  requiredAuthorityLevel?: string;
  participantDecisionRequired: boolean;
  humanReviewRequired: boolean;
  recoveryRequired: boolean;
  evidenceRefs: string[];
  unknownEvidenceRefs: string[];
};
