import { createAuditEvent } from "@/lib/audit/audit-event-service";

export const SUPPORT_INTEL_AUDIT_ACTIONS = [
  "support_intel.spider.run",
  "support_intel.spider.page_fetched",
  "support_intel.spider.denied",
  "support_intel.sna.snapshot_used",
  "support_intel.sma.match_run",
  "support_intel.sma.eligibility_blocked",
  "support_intel.reg.lookup",
  "support_intel.reg.conflict_queued",
  "support_intel.wvg.lookup",
  "support_intel.wvg.ambiguous_identity",
  "support_intel.demand.query",
  "support_intel.consent.blocked",
  "support_intel.operational_denied",
  "support_intel.human_review.created",
] as const;

export type SupportIntelAuditAction =
  (typeof SUPPORT_INTEL_AUDIT_ACTIONS)[number];

export async function auditSupportIntelligence(input: {
  action: SupportIntelAuditAction;
  actorUserId?: string | null;
  participantId?: string | null;
  organisationId?: string | null;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await createAuditEvent({
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? undefined,
      actorUserId: input.actorUserId ?? undefined,
      participantId: input.participantId ?? undefined,
      organisationId: input.organisationId ?? undefined,
      metadata: input.metadata ?? {},
    });
  } catch {
    // Best-effort: unit tests and degraded DB must not break matching/discovery.
  }
}
