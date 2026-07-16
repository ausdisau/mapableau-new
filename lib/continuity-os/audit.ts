import { createAuditEvent } from "@/lib/audit/audit-event-service";

export type ContinuityAuditAction =
  | "continuity.life_event.created"
  | "continuity.life_event.updated"
  | "continuity.life_event.stopped"
  | "continuity.resilience.assessed"
  | "continuity.failure.signal_received"
  | "continuity.failure.classified"
  | "continuity.impact.calculated"
  | "continuity.recovery.case_created"
  | "continuity.recovery.option_selected"
  | "continuity.recovery.proposal_prepared"
  | "continuity.recovery.escalated"
  | "continuity.handoff.sent"
  | "continuity.handoff.accepted"
  | "continuity.handoff.rejected"
  | "continuity.receipt.created"
  | "continuity.outcome.recorded"
  | "continuity.friction.recorded";

export async function auditContinuityEvent(params: {
  action: ContinuityAuditAction;
  actorUserId: string;
  participantId: string;
  entityType: string;
  entityId: string;
  organisationId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    participantId: params.participantId,
    organisationId: params.organisationId ?? null,
    metadata: {
      continuityOs: true,
      ...params.metadata,
    },
  });
}
