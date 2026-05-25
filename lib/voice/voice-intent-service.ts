import { deleteVoiceAudio } from "@/lib/voice/voice-audio-storage";
import { buildDraftPayloadFromTranscript } from "@/lib/voice/voice-draft-builder";
import { recordVoiceEvent } from "@/lib/voice/voice-event-service";
import { assertTranscriptOwner } from "@/lib/voice/voice-session-service";
import { prisma } from "@/lib/prisma";

export async function updateTranscriptText(
  transcriptId: string,
  userId: string,
  editedTranscript: string
) {
  const existing = await assertTranscriptOwner(transcriptId, userId);
  if (existing.status === "discarded") {
    throw new Error("TRANSCRIPT_DISCARDED");
  }

  const updated = await prisma.voiceTranscript.update({
    where: { id: transcriptId },
    data: { editedTranscript },
  });

  await recordVoiceEvent({
    sessionId: existing.sessionId,
    transcriptId,
    userId,
    eventType: "transcript_edited",
  });

  return updated;
}

export async function confirmTranscript(transcriptId: string, userId: string) {
  const existing = await assertTranscriptOwner(transcriptId, userId);
  if (existing.status !== "pending_review") {
    throw new Error("INVALID_STATUS");
  }

  const updated = await prisma.voiceTranscript.update({
    where: { id: transcriptId },
    data: { status: "confirmed" },
  });

  await prisma.voiceSession.update({
    where: { id: existing.sessionId },
    data: { status: "review" },
  });

  await recordVoiceEvent({
    sessionId: existing.sessionId,
    transcriptId,
    userId,
    eventType: "transcript_confirmed",
  });

  return updated;
}

export async function discardTranscript(transcriptId: string, userId: string) {
  const existing = await assertTranscriptOwner(transcriptId, userId);

  await prisma.voiceIntentDraft.updateMany({
    where: { transcriptId },
    data: { status: "discarded" },
  });

  const updated = await prisma.voiceTranscript.update({
    where: { id: transcriptId },
    data: { status: "discarded" },
  });

  const session = await prisma.voiceSession.update({
    where: { id: existing.sessionId },
    data: { status: "discarded" },
  });

  if (session.audioFileKey) {
    await deleteVoiceAudio(session.audioFileKey);
    await prisma.voiceSession.update({
      where: { id: session.id },
      data: { audioFileKey: null },
    });
  }

  await recordVoiceEvent({
    sessionId: existing.sessionId,
    transcriptId,
    userId,
    eventType: "transcript_discarded",
  });

  return updated;
}

/** Creates intent draft only — does NOT submit bookings/messages/logs. */
export async function createIntentDraftFromTranscript(
  transcriptId: string,
  userId: string
) {
  const existing = await assertTranscriptOwner(transcriptId, userId);
  if (existing.status !== "confirmed") {
    throw new Error("TRANSCRIPT_NOT_CONFIRMED");
  }

  const text =
    existing.editedTranscript?.trim() || existing.rawTranscript.trim();
  const draftType = existing.session.intendedDraftType;
  const payload = buildDraftPayloadFromTranscript(
    draftType as never,
    text
  );

  const draft = await prisma.voiceIntentDraft.create({
    data: {
      transcriptId,
      draftType,
      draftPayloadJson: payload as object,
      status: "draft",
    },
  });

  await prisma.voiceSession.update({
    where: { id: existing.sessionId },
    data: { status: "completed" },
  });

  await recordVoiceEvent({
    sessionId: existing.sessionId,
    transcriptId,
    userId,
    eventType: "draft_created",
    payload: { draftId: draft.id, draftType },
  });

  return draft;
}
