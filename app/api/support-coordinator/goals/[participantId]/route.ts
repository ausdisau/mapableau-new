import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { accessDeniedMessage } from "@/lib/access/role-policy";
import { listGoalProgress } from "@/lib/support-coordination/goal-progress-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ participantId: string }> }
) {
  const user = await requireApiPermission("coordinator:portal");
  if (user instanceof Response) return user;

  const { participantId } = await params;

  try {
    const goals = await listGoalProgress({
      participantId,
      coordinatorId: user.id,
      actorRole: user.primaryRole,
    });
    return jsonOk({ goals });
  } catch {
    return jsonError(accessDeniedMessage("no_consent"), 403);
  }
}
