import { disableOptionalWatch } from "@/lib/ai/platform/mission-watch";
import { getMissionPlan } from "@/lib/ai/platform/missions";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isAgenticNerveCentreEnabled } from "@/lib/config/agentic-nerve-centre";
import { isMissionWatchEnabled } from "@/lib/config/mission-watch";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ missionId: string; watchId: string }> };

export async function POST(req: Request, context: RouteContext) {
  if (!isAgenticNerveCentreEnabled()) return jsonError("AGENTIC_NERVE_CENTRE_DISABLED", 403);
  if (!isMissionWatchEnabled()) return jsonError("MISSION_WATCH_DISABLED", 403);
  const ip = getClientIp(req);
  if (!checkIpRateLimit(`ai-missions-watches-disable:${ip}`, { windowMs: 60_000, max: 30 })) {
    return jsonError("RATE_LIMITED", 429);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { missionId, watchId } = await context.params;
  if (!getMissionPlan(missionId)) return jsonError("MISSION_NOT_FOUND", 404);
  try {
    const watch = disableOptionalWatch({ missionId, watchId });
    await createAuditEvent({
      actorUserId: user.id, participantId: user.id, action: "mission.watch.disabled",
      entityType: "MissionWatch", entityId: watchId,
      metadata: { missionId, optional: watch.optional },
    });
    return jsonOk({ watch });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "WATCH_DISABLE_FAILED", 400);
  }
}
