import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getVoicePreferences } from "@/lib/voice/voice-preferences-service";
import { transcribeVoiceSession } from "@/lib/voice/voice-transcription-service";
import { VoiceAdapterError } from "@/lib/voice/voice-adapter";

const ALLOWED_AUDIO = [
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/mpeg",
  "audio/mp4",
];

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const form = await req.formData();
  const sessionId = form.get("sessionId") as string | null;
  const file = form.get("audio") as File | null;
  if (!sessionId || !file) {
    return jsonError("sessionId and audio file required", 400);
  }

  const mimeType = file.type || "audio/webm";
  if (!ALLOWED_AUDIO.includes(mimeType)) {
    return jsonError("Unsupported audio format", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const prefs = await getVoicePreferences(user.id);

  try {
    const result = await transcribeVoiceSession({
      sessionId,
      userId: user.id,
      audioBuffer: buffer,
      mimeType,
      language: (form.get("language") as string) || "en-AU",
      consentThirdParty: prefs.consentThirdPartyStt,
      storeAudioConsent: prefs.storeAudioAfterTranscribe,
    });

    return jsonOk({
      session: result.session,
      transcript: {
        id: result.transcript.id,
        rawTranscript: result.transcript.rawTranscript,
        editedTranscript: result.transcript.editedTranscript,
        confidence: result.transcript.confidence,
        status: result.transcript.status,
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("Forbidden", 403);
    }
    if (e instanceof VoiceAdapterError) {
      return jsonError(e.message, 400);
    }
    throw e;
  }
}
