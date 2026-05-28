import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { listLegacyVehiclesForLink } from "@/lib/transport/transport-fleet-read-service";
import { requireProviderOrgId } from "@/lib/transport/transport-api-helpers";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";

export async function GET(req: Request) {
  const user = await requireApiPermission("transport:manage:org");
  if (user instanceof Response) return user;
  const orgId = new URL(req.url).searchParams.get("organisationId");
  if (!orgId) return jsonError("organisationId required", 400);
  try {
    await requireProviderOrgId(user, orgId);
    const vehicles = await listLegacyVehiclesForLink(orgId);
    return jsonOk({ vehicles });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
