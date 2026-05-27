import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { mapFleetDriverRecord } from "@/lib/transport/transport-fleet-api-mapper";
import { getFleetDriver } from "@/lib/transport/transport-fleet-read-service";
import { updateFleetDriver } from "@/lib/transport/transport-fleet-driver-service";
import { requireProviderOrgId } from "@/lib/transport/transport-api-helpers";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { updateFleetDriverSchema } from "@/lib/validation/transport-fleet-schemas";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ driverId: string }> }
) {
  const user = await requireApiPermission("transport:manage:org");
  if (user instanceof Response) return user;
  const orgId = new URL(req.url).searchParams.get("organisationId");
  if (!orgId) return jsonError("organisationId required", 400);
  const { driverId } = await params;
  try {
    await requireProviderOrgId(user, orgId);
    const driver = await getFleetDriver(orgId, driverId);
    if (!driver) {
      throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND", "Fleet driver not found.");
    }
    return jsonOk({ driver });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ driverId: string }> }
) {
  const user = await requireApiPermission("transport:manage:org");
  if (user instanceof Response) return user;
  const orgId = new URL(req.url).searchParams.get("organisationId");
  if (!orgId) return jsonError("organisationId required", 400);
  const { driverId } = await params;
  try {
    await requireProviderOrgId(user, orgId);
    const body = updateFleetDriverSchema.parse(await req.json());
    const driver = await updateFleetDriver(user, orgId, driverId, body);
    return jsonOk({ driver: mapFleetDriverRecord(driver) });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
