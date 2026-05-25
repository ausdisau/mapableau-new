import { voiceConfig } from "@/lib/voice/config";
import { resolveVoiceAdapter } from "@/lib/voice/voice-adapter-registry";
import { recordVoiceEvent } from "@/lib/voice/voice-event-service";
import { prisma } from "@/lib/prisma";
import type { VoiceDraftType } from "@/types/voice";

export async function createVoiceSession(params: {
  userId: string;
  organisationId?: string | null;
  intendedDraftType: VoiceDraftType;
}) {
  const adapter = resolveVoiceAdapter();
  const session = await prisma.voiceSession.create({
    data: {
      userId: params.userId,
      organisationId: params.organisationId ?? null,
      intendedDraftType: params.intendedDraftType,
      status: "created",
      adapterUsed: adapter.kind,
      audioRetention: "ephemeral",
    },
  });

  await recordVoiceEvent({
    sessionId: session.id,
    userId: params.userId,
    eventType: "session_created",
    payload: {
      intendedDraftType: params.intendedDraftType,
      adapter: adapter.kind,
      deleteAudioAfterTranscribe: voiceConfig.deleteAudioAfterTranscribe,
    },
  });

  return session;
}

export async function getVoiceSessionForUser(sessionId: string, userId: string) {
  return prisma.voiceSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      transcripts: {
        orderBy: { createdAt: "desc" },
        include: { intentDrafts: true },
      },
    },
  });
}

export async function assertTranscriptOwner(transcriptId: string, userId: string) {
  const transcript = await prisma.voiceTranscript.findUnique({
    where: { id: transcriptId },
    include: {
      session: {
        select: {
          id: true,
          userId: true,
          intendedDraftType: true,
          audioFileKey: true,
        },
      },
    },
  });
  if (!transcript || transcript.session.userId !== userId) {
    throw new Error("FORBIDDEN");
  }
  return transcript;
}
