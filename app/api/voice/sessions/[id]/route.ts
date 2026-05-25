import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getVoiceSessionForUser } from "@/lib/voice/voice-session-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;

  const session = await getVoiceSessionForUser(id, user.id);
  if (!session) return jsonError("Not found", 404);

  return jsonOk({ session });
}
