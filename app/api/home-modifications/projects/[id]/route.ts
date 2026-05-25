import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { accessDeniedMessage } from "@/lib/access/role-policy";
import { assertHomeModificationAccess } from "@/lib/home-modifications/home-modification-service";
import { getProject } from "@/lib/home-modifications/project-milestone-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;

  const project = await getProject({ projectId: id });
  if (!project) return jsonError(accessDeniedMessage("not_found"), 404);

  const allowed = await assertHomeModificationAccess({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    participantId: project.participantId,
    providerId: project.providerId,
  });
  if (!allowed) return jsonError(accessDeniedMessage("no_permission"), 403);

  return jsonOk({
    project,
    fundingDisclaimer:
      "Funding notes are guidance only. MapAble does not guarantee NDIS funding approval.",
  });
}
