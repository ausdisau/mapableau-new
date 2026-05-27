import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { mapFleetVehicleRecord } from "@/lib/transport/transport-fleet-api-mapper";
import { getFleetVehicle } from "@/lib/transport/transport-fleet-read-service";
import { updateFleetVehicle } from "@/lib/transport/transport-fleet-vehicle-service";
import { requireProviderOrgId } from "@/lib/transport/transport-api-helpers";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { updateFleetVehicleSchema } from "@/lib/validation/transport-fleet-schemas";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  const user = await requireApiPermission("transport:manage:org");
  if (user instanceof Response) return user;
  const orgId = new URL(req.url).searchParams.get("organisationId");
  if (!orgId) return jsonError("organisationId required", 400);
  const { vehicleId } = await params;
  try {
    await requireProviderOrgId(user, orgId);
    const vehicle = await getFleetVehicle(orgId, vehicleId);
    if (!vehicle) {
      throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND", "Fleet vehicle not found.");
    }
    return jsonOk({ vehicle });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  const user = await requireApiPermission("transport:manage:org");
  if (user instanceof Response) return user;
  const orgId = new URL(req.url).searchParams.get("organisationId");
  if (!orgId) return jsonError("organisationId required", 400);
  const { vehicleId } = await params;
  try {
    await requireProviderOrgId(user, orgId);
    const body = updateFleetVehicleSchema.parse(await req.json());
    const vehicle = await updateFleetVehicle(user, orgId, vehicleId, body);
    return jsonOk({ vehicle: mapFleetVehicleRecord(vehicle) });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
