import { thirdPartyAllowedForUser, voiceConfig } from "@/lib/voice/config";
import {
  deleteVoiceAudio,
  extensionFromMime,
  storeVoiceAudioTemp,
} from "@/lib/voice/voice-audio-storage";
import { resolveVoiceAdapter } from "@/lib/voice/voice-adapter-registry";
import { VoiceAdapterError } from "@/lib/voice/voice-adapter";
import { recordVoiceEvent } from "@/lib/voice/voice-event-service";
import { prisma } from "@/lib/prisma";
import type { VoiceAdapterKind } from "@/types/voice";

export async function transcribeVoiceSession(params: {
  sessionId: string;
  userId: string;
  audioBuffer: Buffer;
  mimeType: string;
  language?: string;
  consentThirdParty?: boolean;
  storeAudioConsent?: boolean;
}) {
  const session = await prisma.voiceSession.findUnique({
    where: { id: params.sessionId },
  });
  if (!session || session.userId !== params.userId) {
    throw new Error("FORBIDDEN");
  }

  const adapter = resolveVoiceAdapter(session.adapterUsed as VoiceAdapterKind | undefined);

  if (!thirdPartyAllowedForUser(params.consentThirdParty ?? false)) {
    if (adapter.kind !== "mock" && adapter.kind !== "whisper_cpp") {
      throw new VoiceAdapterError(
        "Third-party speech services require explicit consent in your voice preferences.",
        "NOT_CONFIGURED"
      );
    }
  }

  let audioFileKey: string | null = null;
  const retention =
    params.storeAudioConsent && !voiceConfig.deleteAudioAfterTranscribe
      ? "consented_storage"
      : "ephemeral";

  if (retention === "consented_storage") {
    audioFileKey = await storeVoiceAudioTemp(
      session.id,
      params.audioBuffer,
      extensionFromMime(params.mimeType)
    );
  }

  await prisma.voiceSession.update({
    where: { id: session.id },
    data: { status: "transcribing", adapterUsed: adapter.kind },
  });

  await recordVoiceEvent({
    sessionId: session.id,
    userId: params.userId,
    eventType: "transcription_started",
    payload: { adapter: adapter.kind },
  });

  try {
    const result = await adapter.transcribe({
      audioBuffer: params.audioBuffer,
      mimeType: params.mimeType,
      language: params.language,
      sessionId: session.id,
      intendedDraftType: session.intendedDraftType,
    });

    if (voiceConfig.deleteAudioAfterTranscribe && audioFileKey) {
      await deleteVoiceAudio(audioFileKey);
      audioFileKey = null;
    } else if (retention === "ephemeral" && !params.storeAudioConsent) {
      /* audio never persisted */
    }

    const transcript = await prisma.voiceTranscript.create({
      data: {
        sessionId: session.id,
        rawTranscript: result.text,
        editedTranscript: result.text,
        confidence: result.confidence,
        language: result.language,
        status: "pending_review",
        adapterUsed: result.adapter,
      },
    });

    await prisma.voiceSession.update({
      where: { id: session.id },
      data: {
        status: "review",
        adapterUsed: result.adapter,
        audioFileKey,
        audioRetention: retention,
      },
    });

    await recordVoiceEvent({
      sessionId: session.id,
      transcriptId: transcript.id,
      userId: params.userId,
      eventType: "transcription_completed",
      payload: {
        confidence: result.confidence,
        adapter: result.adapter,
        audioDeleted: voiceConfig.deleteAudioAfterTranscribe,
      },
    });

    return { session, transcript, result };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Transcription failed";
    await prisma.voiceSession.update({
      where: { id: session.id },
      data: { status: "error", errorMessage: message },
    });
    await recordVoiceEvent({
      sessionId: session.id,
      userId: params.userId,
      eventType: "transcription_failed",
      payload: { message },
    });
    throw e;
  }
}
