import { reassessMission, formatRecoveryForParticipant, getRecoverySnapshot } from "@/lib/ai/platform/recovery";
import { getMissionPlan } from "@/lib/ai/platform/missions";
import { requireApiSession } from "@/lib/api/auth-handler";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAgenticNerveCentreEnabled } from "@/lib/config/agentic-nerve-centre";
import { isAdaptiveRecoveryEnabled } from "@/lib/config/adaptive-recovery";
import { createAuditEvent } from "@/lib/audit/audit-event-service";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ missionId: string }> };

export async function POST(req: Request, context: RouteContext) {
  if (!isAgenticNerveCentreEnabled()) return jsonError("AGENTIC_NERVE_CENTRE_DISABLED", 403);
  if (!isAdaptiveRecoveryEnabled()) return jsonError("ADAPTIVE_RECOVERY_DISABLED", 403);
  const ip = getClientIp(req);
  if (!checkIpRateLimit(`ai-missions-reassess:${ip}`, { windowMs: 60_000, max: 15 })) return jsonError("RATE_LIMITED", 429);
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { missionId } = await context.params;
  if (!getMissionPlan(missionId)) return jsonError("MISSION_NOT_FOUND", 404);
  try {
    const state = reassessMission({ missionId, actorId: user.id, participantId: user.id });
    await createAuditEvent({
      actorUserId: user.id, participantId: user.id, action: "mission.recovery.reassessed",
      entityType: "MissionRecovery", entityId: missionId,
      metadata: { materialityGate: state.materialityGate, status: state.status, alternativeCount: state.alternatives.length },
    });
    const snapshot = getRecoverySnapshot(missionId);
    return jsonOk({
      state,
      presentation: snapshot.state ? formatRecoveryForParticipant({ state: snapshot.state, activity: snapshot.activity }) : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "REASSESS_FAILED";
    return jsonError(message, message === "RECOVERY_KILL_SWITCH_ACTIVE" ? 503 : 400);
  }
}
