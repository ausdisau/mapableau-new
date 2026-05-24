import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { accessDeniedMessage } from "@/lib/access/role-policy";
import { getParticipantOverviewForCoordinator } from "@/lib/support-coordination/support-coordination-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("coordinator:portal");
  if (user instanceof Response) return user;

  const { id } = await params;

  try {
    const overview = await getParticipantOverviewForCoordinator({
      coordinatorId: user.id,
      participantId: id,
      actorRole: user.primaryRole,
    });
    return jsonOk(overview);
  } catch {
    return jsonError(accessDeniedMessage("no_consent"), 403);
  }
}
