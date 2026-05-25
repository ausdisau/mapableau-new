import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { UserRole } from "@/types/mapable";
import type { ThreadType } from "@/types/messages";

const SENSITIVE_THREAD_TYPES: ThreadType[] = [
  "incident_safe_comms",
  "complaint",
  "admin_support",
];

export function isSensitiveThreadType(threadType: ThreadType): boolean {
  return SENSITIVE_THREAD_TYPES.includes(threadType);
}

export async function auditThreadAccess(params: {
  actorUserId: string;
  actorRole: UserRole;
  threadId: string;
  threadType: ThreadType;
  participantId?: string | null;
  action: string;
}) {
  if (!isSensitiveThreadType(params.threadType) && params.action !== "escalate") {
    return;
  }
  await createAuditEvent({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole as never,
    action: "admin.accessed_sensitive_record",
    entityType: "CommunicationThread",
    entityId: params.threadId,
    participantId: params.participantId ?? undefined,
    metadata: { context: "communication_centre", detail: params.action },
  });
}

export async function auditMessageSent(params: {
  actorUserId: string;
  actorRole: UserRole;
  threadId: string;
  messageId: string;
  threadType: ThreadType;
}) {
  if (!isSensitiveThreadType(params.threadType)) return;
  await createAuditEvent({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole as never,
    action: "message.sent",
    entityType: "CommunicationMessage",
    entityId: params.messageId,
    metadata: { threadId: params.threadId, threadType: params.threadType },
  });
}
