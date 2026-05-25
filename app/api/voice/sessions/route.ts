import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getVoicePreferences } from "@/lib/voice/voice-preferences-service";
import { createVoiceSession } from "@/lib/voice/voice-session-service";
import { createVoiceSessionSchema } from "@/lib/validation/voice";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const prefs = await getVoicePreferences(user.id);
  if (!prefs.voiceEnabled) {
    return jsonError("Voice input is disabled in your preferences", 403);
  }

  const body = await req.json();
  const parsed = createVoiceSessionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, 400);
  }

  const session = await createVoiceSession({
    userId: user.id,
    organisationId: parsed.data.organisationId,
    intendedDraftType: parsed.data.intendedDraftType,
  });

  return jsonOk({ session }, 201);
}
