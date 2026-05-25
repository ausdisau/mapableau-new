import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createIntentDraftFromTranscript } from "@/lib/voice/voice-intent-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;

  try {
    const draft = await createIntentDraftFromTranscript(id, user.id);
    return jsonOk(
      {
        draft,
        message:
          "Draft created. Review and submit manually — voice does not submit bookings or messages automatically.",
      },
      201
    );
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("Forbidden", 403);
    }
    if (e instanceof Error && e.message === "TRANSCRIPT_NOT_CONFIRMED") {
      return jsonError("Confirm the transcript before creating a draft", 400);
    }
    throw e;
  }
}
