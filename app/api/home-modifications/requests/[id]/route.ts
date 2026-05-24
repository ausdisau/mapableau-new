import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { accessDeniedMessage } from "@/lib/access/role-policy";
import { getHomeModificationRequest } from "@/lib/home-modifications/home-modification-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;

  try {
    const request = await getHomeModificationRequest({
      requestId: id,
      actorUserId: user.id,
      actorRole: user.primaryRole,
    });
    return jsonOk({ request });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "FORBIDDEN") {
        return jsonError(accessDeniedMessage("no_permission"), 403);
      }
      if (e.message === "NOT_FOUND") {
        return jsonError(accessDeniedMessage("not_found"), 404);
      }
    }
    return jsonError("Could not load request", 400);
  }
}
