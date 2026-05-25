import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { acceptTransportTripRequest } from "@/lib/transport-mvp/provider-inbox-service";

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
    const trip = await acceptTransportTripRequest(id, organisationId, user.id);
    return jsonOk({ trip });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Request not found", 404);
    }
    if (e instanceof Error && e.message === "INVALID_STATUS") {
      return jsonError("Request cannot be accepted", 400);
    }
    return jsonError("Accept failed", 500);
  }
}
