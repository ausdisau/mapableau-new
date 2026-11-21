import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireProviderOrgId } from "@/lib/transport/transport-api-helpers";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { getProviderScheduleMatrix } from "@/lib/transport/schedule/schedule-matrix-service";

/**
 * Read-only schedule matrix projection for provider transport control.
 * Does not assign drivers or mutate trips.
 */
export async function GET(req: Request) {
  const user = await requireApiPermission("transport:manage:org");
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const orgId = url.searchParams.get("organisationId");
  if (!orgId) return jsonError("organisationId required", 400);
  const day = url.searchParams.get("day") ?? undefined;
  if (day && !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return jsonError("day must be YYYY-MM-DD", 400);
  }

  try {
    await requireProviderOrgId(user, orgId);
    const matrix = await getProviderScheduleMatrix(user, orgId, { day });
    return jsonOk(matrix);
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
