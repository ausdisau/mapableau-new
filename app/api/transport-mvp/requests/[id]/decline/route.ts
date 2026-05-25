import { requireApiPermission } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { declineTransportTripRequest } from "@/lib/transport-mvp/provider-inbox-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("transport:manage:org");
  if (user instanceof Response) return user;
  const { id } = await params;
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];
  if (!organisationId) return jsonError("No organisation membership", 403);

  try {
    const request = await declineTransportTripRequest(id, organisationId, user.id);
    return jsonOk({ request });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Request not found", 404);
    }
    return jsonError("Decline failed", 500);
  }
}
