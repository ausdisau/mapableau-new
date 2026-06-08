import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { y2OrchestrationConfig } from "@/lib/config/y2-orchestration";
import { invitePlanManager } from "@/lib/plan-manager/invoice-review-service";

export async function POST(req: Request) {
  if (!y2OrchestrationConfig.planManagerIntegrationEnabled) {
    return jsonError("Plan manager integration disabled", 403);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json().catch(() => ({}));
  const planManagerId =
    typeof body.planManagerId === "string" ? body.planManagerId.trim() : "";
  const participantId =
    typeof body.participantId === "string"
      ? body.participantId.trim()
      : user.id;

  if (!planManagerId) {
    return jsonError("planManagerId required", 400);
  }

  if (participantId !== user.id) {
    return jsonError("Participants may only invite on their own behalf", 403);
  }

  const relationship = await invitePlanManager({
    participantId,
    planManagerId,
  });

  return jsonOk({ relationship }, 201);
}
