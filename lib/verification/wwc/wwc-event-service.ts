import type { WwcVerificationEventType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function recordWwcVerificationEvent(params: {
  verificationId: string;
  eventType: WwcVerificationEventType;
  actorUserId?: string | null;
  payload?: Record<string, unknown> | null;
  organisationId?: string;
  workerProfileId?: string;
}) {
  const event = await prisma.wwcVerificationEvent.create({
    data: {
      verificationId: params.verificationId,
      eventType: params.eventType,
      actorUserId: params.actorUserId ?? null,
      payloadJson: (params.payload ?? undefined) as object | undefined,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: `wwc_verification.${params.eventType}`,
    entityType: "WwcVerification",
    entityId: params.verificationId,
    organisationId: params.organisationId,
    metadata: {
      workerProfileId: params.workerProfileId,
      ...(params.payload ?? {}),
    },
  });

  return event;
}
