import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { confirmTranscript } from "@/lib/voice/voice-intent-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;

  try {
    const transcript = await confirmTranscript(id, user.id);
    return jsonOk({ transcript });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("Forbidden", 403);
    }
    if (e instanceof Error && e.message === "INVALID_STATUS") {
      return jsonError("Transcript cannot be confirmed in its current state", 400);
    }
    throw e;
  }
}
