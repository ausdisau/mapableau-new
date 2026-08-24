import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  formatMissionPlanForParticipant,
  previewMissionPlan,
} from "@/lib/ai/platform/missions";
import { isAgenticNerveCentreEnabled } from "@/lib/config/agentic-nerve-centre";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ missionId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  if (!isAgenticNerveCentreEnabled()) {
    return jsonError("AGENTIC_NERVE_CENTRE_DISABLED", 403);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { missionId } = await context.params;
  const plan = previewMissionPlan(missionId);
  if (!plan) {
    return jsonError("MISSION_NOT_FOUND", 404);
  }

  return jsonOk({
    plan,
    presentation: formatMissionPlanForParticipant(plan),
  });
}
