import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { updateTranscriptText } from "@/lib/voice/voice-intent-service";
import { patchTranscriptSchema } from "@/lib/validation/voice";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;

  const body = await req.json();
  const parsed = patchTranscriptSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, 400);
  }

  try {
    const transcript = await updateTranscriptText(
      id,
      user.id,
      parsed.data.editedTranscript
    );
    return jsonOk({ transcript });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("Forbidden", 403);
    }
    throw e;
  }
}
