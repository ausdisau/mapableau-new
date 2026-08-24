import {
  createMissionWatch,
  createWatchBodySchema,
  formatMissionWatchForParticipant,
  getMissionWatchSnapshot,
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
type RouteContext = { params: Promise<{ missionId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  if (!isAgenticNerveCentreEnabled()) return jsonError("AGENTIC_NERVE_CENTRE_DISABLED", 403);
  if (!isMissionWatchEnabled()) return jsonError("MISSION_WATCH_DISABLED", 403);
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { missionId } = await context.params;
  if (!getMissionPlan(missionId)) return jsonError("MISSION_NOT_FOUND", 404);
  const snapshot = getMissionWatchSnapshot(missionId);
  return jsonOk({
    watches: snapshot.watches,
    alerts: snapshot.alerts,
    presentation: formatMissionWatchForParticipant({
      watches: snapshot.watches,
      alerts: snapshot.alerts,
    }),
  });
}

export async function POST(req: Request, context: RouteContext) {
  if (!isAgenticNerveCentreEnabled()) return jsonError("AGENTIC_NERVE_CENTRE_DISABLED", 403);
  if (!isMissionWatchEnabled()) return jsonError("MISSION_WATCH_DISABLED", 403);
  const ip = getClientIp(req);
  if (!checkIpRateLimit(`ai-missions-watches:${ip}`, { windowMs: 60_000, max: 30 })) {
    return jsonError("RATE_LIMITED", 429);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { missionId } = await context.params;
  if (!getMissionPlan(missionId)) return jsonError("MISSION_NOT_FOUND", 404);
  let body: unknown;
  try { body = await parseJsonRequestBody(req); }
  catch (e) { const err = jsonBodyErrorResponse(e); return jsonError(err.message, err.status); }
  const parsed = createWatchBodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    const watch = createMissionWatch({ ...parsed.data, missionId, createdBy: user.id });
    await createAuditEvent({
      actorUserId: user.id, participantId: user.id, action: "mission.watch.created",
      entityType: "MissionWatch", entityId: watch.watchId,
      metadata: { missionId, watchType: watch.watchType, optional: watch.optional },
    });
    return jsonOk({ watch });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "WATCH_CREATE_FAILED", 400);
  }
}
