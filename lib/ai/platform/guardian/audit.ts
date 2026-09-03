import { createAuditEvent } from "@/lib/audit/audit-event-service";

import type { GuardianDecision } from "./contracts";

export type GuardianAuditInput = {
  decision: GuardianDecision;
  actorId: string;
  tenantId?: string;
  participantId?: string;
  requestId?: string;
  traceId?: string;
  capabilityKey?: string;
};

/**
 * Audit Guardian decisions via canonical AuditEvent.
 * Stores refs and reason codes — not raw prompts, narratives, images, or CoT.
 */
export async function auditGuardianDecision(
  input: GuardianAuditInput
): Promise<void> {
  const d = input.decision;
  await createAuditEvent({
    actorUserId: input.actorId,
    participantId: input.participantId ?? null,
    organisationId: input.tenantId ?? null,
    action: "guardian.evaluate",
    entityType: "GuardianDecision",
    entityId: input.requestId ?? input.traceId ?? null,
    metadata: {
      traceId: input.traceId,
      requestId: input.requestId,
      purpose: d.purpose,
      dataClasses: d.dataClasses,
      sensitivity: d.sensitivity,
      processingZone: d.processingZone,
      processorId: d.processorId,
      capabilityKey: input.capabilityKey,
      policyVersion: d.policyVersion,
      reasonCodes: d.reasonCodes,
      decision: d.decision,
      humanReviewRequired: d.humanReviewRequired,
      participantConfirmationRequired: d.participantConfirmationRequired,
      modelSignalCount: d.modelSignals.length,
      modelSignalTypes: d.modelSignals.map((s) => s.signalType),
      requiresHumanReportabilityAssessment:
        d.requiresHumanReportabilityAssessment ?? false,
      // Never log raw model output bodies
    },
  });
}
