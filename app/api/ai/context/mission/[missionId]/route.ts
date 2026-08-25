import { getMissionPlan } from "@/lib/ai/platform/missions";
import {
  formatContextListForParticipant,
  queryMissionContext,
} from "@/lib/ai/platform/context-fabric";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAgenticNerveCentreEnabled } from "@/lib/config/agentic-nerve-centre";
import { isContextFabricEnabled } from "@/lib/config/context-fabric";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ missionId: string }> };

/**
 * GET /api/ai/context/mission/:missionId
 * Internal read of authorised mission context slices (not a full participant dump).
 */
export async function GET(req: Request, context: RouteContext) {
  if (!isAgenticNerveCentreEnabled()) return jsonError("AGENTIC_NERVE_CENTRE_DISABLED", 403);
  if (!isContextFabricEnabled()) return jsonError("CONTEXT_FABRIC_DISABLED", 403);

  const ip = getClientIp(req);
  if (!checkIpRateLimit(`ai-context-mission:${ip}`, { windowMs: 60_000, max: 60 })) {
    return jsonError("RATE_LIMITED", 429);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { missionId } = await context.params;
  const plan = getMissionPlan(missionId);
  if (!plan) return jsonError("MISSION_NOT_FOUND", 404);

  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId") ?? "default";
  const participantId =
    url.searchParams.get("participantId") ?? user.id;
  const consentScopes = (url.searchParams.get("consentScopes") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const result = queryMissionContext({
    missionId,
    participantId,
    tenantId,
    consentScopes,
    actor: {
      actorId: user.id,
      role: user.id === participantId ? "participant" : "admin",
      tenantId,
    },
  });

  return jsonOk({
    ...result,
    provenance: formatContextListForParticipant(result.records),
  });
}
