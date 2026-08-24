import { formatMissionPlanForParticipant, getMissionPlan } from "@/lib/ai/platform/missions";
import { formatRecoveryForParticipant, getRecoverySnapshot } from "@/lib/ai/platform/recovery";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdaptiveRecoveryEnabled } from "@/lib/config/adaptive-recovery";
import { isAgenticNerveCentreEnabled } from "@/lib/config/agentic-nerve-centre";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ missionId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  if (!isAgenticNerveCentreEnabled()) return jsonError("AGENTIC_NERVE_CENTRE_DISABLED", 403);
  if (!isAdaptiveRecoveryEnabled()) return jsonError("ADAPTIVE_RECOVERY_DISABLED", 403);
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { missionId } = await context.params;
  const plan = getMissionPlan(missionId);
  if (!plan) return jsonError("MISSION_NOT_FOUND", 404);
  const snapshot = getRecoverySnapshot(missionId);
  return jsonOk({
    state: snapshot.state, activity: snapshot.activity,
    planVersions: snapshot.planVersions.map(v => ({ planVersion: v.planVersion, basedOnVersion: v.basedOnVersion, changeReason: v.changeReason, createdAt: v.createdAt })),
    activePlan: plan,
    presentation: snapshot.state ? formatRecoveryForParticipant({ state: snapshot.state, activity: snapshot.activity }) : formatMissionPlanForParticipant(plan),
  });
}
