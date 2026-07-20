import { createAuditEvent } from "@/lib/audit/audit-event-service";

const SENSITIVE_METADATA_KEYS = [
  "diagnosis",
  "clinicalNotes",
  "freeText",
  "body",
  "content",
  "payload",
  "raw",
  "documentText",
  "homeAddress",
  "behaviourDescription",
  "planSectionText",
  "questionnaireAnswer",
  "ndisNumber",
  "participantName",
  "dateOfBirth",
];

export function sanitisePbsAuditMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!metadata) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_METADATA_KEYS.includes(key)) continue;
    if (/ndis|password|secret|clinical|behaviour|behavior/i.test(key) && typeof value === "string") {
      continue;
    }
    if (typeof value === "string" && value.length > 500) continue;
    out[key] = value;
  }
  return out;
}

export interface PbsAuditInput {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  participantId?: string | null;
  organisationId?: string | null;
  correlationId: string;
  metadata?: Record<string, unknown> | null;
}

export async function emitPbsAuditEvent(input: PbsAuditInput): Promise<void> {
  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: `pbs.${input.action}`,
    entityType: input.entityType,
    entityId: input.entityId,
    participantId: input.participantId,
    organisationId: input.organisationId,
    metadata: {
      correlationId: input.correlationId,
      ...sanitisePbsAuditMetadata(input.metadata),
    },
  });
}

export function createPbsCorrelationId(): string {
  return `pbs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
