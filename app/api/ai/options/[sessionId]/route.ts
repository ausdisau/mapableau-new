import { formatOptionsForParticipant, getOptionsSnapshot, OptionsEngineError } from "@/lib/ai/platform/options-engine";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isOptionsEngineEnabled } from "@/lib/config/options-engine";
export const runtime = "nodejs";
type Params = { params: Promise<{ sessionId: string }> };
export async function GET(req: Request, { params }: Params) {
  if (!isOptionsEngineEnabled()) return jsonError("OPTIONS_ENGINE_DISABLED", 403);
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { sessionId } = await params;
  const tenantId = new URL(req.url).searchParams.get("tenantId") ?? user.id;
  try {
    const session = getOptionsSnapshot({ sessionId, participantId: user.id, tenantId });
    return jsonOk({ session, presentation: formatOptionsForParticipant(session) });
  } catch (err) {
    if (err instanceof OptionsEngineError) return jsonError(err.message, err.message.includes("ISOLATION") ? 403 : 404);
    return jsonError("OPTIONS_SESSION_LOOKUP_FAILED", 400);
  }
}
