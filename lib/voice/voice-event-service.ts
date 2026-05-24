import type { VoiceEventType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function recordVoiceEvent(params: {
  sessionId?: string;
  transcriptId?: string;
  userId: string;
  eventType: VoiceEventType;
  payload?: Record<string, unknown>;
}) {
  await prisma.voiceEvent.create({
    data: {
      sessionId: params.sessionId,
      transcriptId: params.transcriptId,
      userId: params.userId,
      eventType: params.eventType,
      payloadJson: (params.payload ?? undefined) as object | undefined,
    },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: `voice.${params.eventType}`,
    entityType: params.transcriptId ? "VoiceTranscript" : "VoiceSession",
    entityId: params.transcriptId ?? params.sessionId,
    metadata: params.payload ?? undefined,
  });
}
