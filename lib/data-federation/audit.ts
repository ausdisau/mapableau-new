import { createAuditEvent } from "@/lib/audit/audit-event-service";

export async function auditDisclosure(input: {
  actorId?: string | null;
  subjectId: string;
  action: string;
  metadata: Record<string, unknown>;
  outcome: "allowed" | "denied" | "minimised" | "requires_participant_review";
}): Promise<void> {
  await createAuditEvent({
    actorUserId: input.actorId ?? null,
    action: `federation.disclosure.${input.outcome}`,
    entityType: "DisclosureManifest",
    participantId: input.subjectId,
    metadata: { ...input.metadata, actionLabel: input.action },
  }).catch(() => {});
}
