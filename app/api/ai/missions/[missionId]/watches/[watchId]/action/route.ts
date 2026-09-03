import {
  applyParticipantWatchAction,
  participantWatchActionBodySchema,
} from "@/lib/ai/platform/mission-watch";
import { getMissionPlan } from "@/lib/ai/platform/missions";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonBodyErrorResponse, parseJsonRequestBody } from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isAgenticNerveCentreEnabled } from "@/lib/config/agentic-nerve-centre";
import { isMissionWatchEnabled } from "@/lib/config/mission-watch";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ missionId: string; watchId: string }> };

export async function POST(req: Request, context: RouteContext) {
  if (!isAgenticNerveCentreEnabled()) return jsonError("AGENTIC_NERVE_CENTRE_DISABLED", 403);
  if (!isMissionWatchEnabled()) return jsonError("MISSION_WATCH_DISABLED", 403);
  const ip = getClientIp(req);
  if (!checkIpRateLimit(`ai-missions-watches-action:${ip}`, { windowMs: 60_000, max: 30 })) {
    return jsonError("RATE_LIMITED", 429);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { missionId, watchId } = await context.params;
  if (!getMissionPlan(missionId)) return jsonError("MISSION_NOT_FOUND", 404);
  let body: unknown;
  try { body = await parseJsonRequestBody(req); }
  catch (e) { const err = jsonBodyErrorResponse(e); return jsonError(err.message, err.status); }
  const parsed = participantWatchActionBodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    const result = applyParticipantWatchAction({
      missionId, watchId, action: parsed.data.action, minutes: parsed.data.minutes,
      participantId: user.id,
    });
    await createAuditEvent({
      actorUserId: user.id, participantId: user.id, action: "mission.watch.participant_action",
      entityType: "MissionWatch", entityId: watchId,
      metadata: { missionId, participantAction: parsed.data.action },
    });
    return jsonOk(result);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "WATCH_ACTION_FAILED", 400);
  }
}
