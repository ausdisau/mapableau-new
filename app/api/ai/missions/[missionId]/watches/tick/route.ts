import { tickMissionWatches, tickWatchBodySchema } from "@/lib/ai/platform/mission-watch";
import { getMissionPlan } from "@/lib/ai/platform/missions";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonBodyErrorResponse, parseJsonRequestBody } from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isAgenticNerveCentreEnabled } from "@/lib/config/agentic-nerve-centre";
import { isMissionWatchEnabled } from "@/lib/config/mission-watch";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ missionId: string }> };

/** Internal evaluate/tick — not a public arbitrary agent loop. */
export async function POST(req: Request, context: RouteContext) {
  if (!isAgenticNerveCentreEnabled()) return jsonError("AGENTIC_NERVE_CENTRE_DISABLED", 403);
  if (!isMissionWatchEnabled()) return jsonError("MISSION_WATCH_DISABLED", 403);
  const ip = getClientIp(req);
  if (!checkIpRateLimit(`ai-missions-watches-tick:${ip}`, { windowMs: 60_000, max: 20 })) {
    return jsonError("RATE_LIMITED", 429);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { missionId } = await context.params;
  if (!getMissionPlan(missionId)) return jsonError("MISSION_NOT_FOUND", 404);
  let body: unknown = {};
  try {
    if (req.headers.get("content-length") !== "0") body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e); return jsonError(err.message, err.status);
  }
  const parsed = tickWatchBodySchema.safeParse(body ?? {});
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    const tick = tickMissionWatches({
      missionId, participantId: user.id,
      actorConsentScopes: parsed.data.actorConsentScopes,
      revokedConsentScopes: parsed.data.revokedConsentScopes,
      referenceTime: parsed.data.referenceTime ? new Date(parsed.data.referenceTime) : undefined,
      ingestRecoveryEvents: parsed.data.ingestRecoveryEvents,
    });
    await createAuditEvent({
      actorUserId: user.id, participantId: user.id, action: "mission.watch.ticked",
      entityType: "MissionWatchTick", entityId: missionId,
      metadata: {
        watchesEvaluated: tick.watchesEvaluated, fired: tick.fired.length,
        alertsCreated: tick.alertsCreated.length,
        operationalActionsCreated: tick.operationalActionsCreated,
      },
    });
    return jsonOk({ tick });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "WATCH_TICK_FAILED", 400);
  }
}
