import { recordVoiceEvent } from "@/lib/voice/voice-event-service";
import { prisma } from "@/lib/prisma";

/** Text/AAC fallback without audio upload. */
export async function createTranscriptFromText(params: {
  sessionId: string;
  userId: string;
  text: string;
}) {
  const session = await prisma.voiceSession.findFirst({
    where: { id: params.sessionId, userId: params.userId },
  });
  if (!session) throw new Error("FORBIDDEN");

  const transcript = await prisma.voiceTranscript.create({
    data: {
      sessionId: session.id,
      rawTranscript: params.text,
      editedTranscript: params.text,
      status: "pending_review",
      adapterUsed: "mock",
      confidence: 1,
      language: "en-AU",
    },
  });

  await prisma.voiceSession.update({
    where: { id: session.id },
    data: { status: "review" },
  });

  await recordVoiceEvent({
    sessionId: session.id,
    transcriptId: transcript.id,
    userId: params.userId,
    eventType: "transcription_completed",
    payload: { source: "text_fallback" },
  });

  return transcript;
}
