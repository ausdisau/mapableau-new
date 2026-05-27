import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { mapFleetVehicleRecord } from "@/lib/transport/transport-fleet-api-mapper";
import { patchFleetVehicleVerifications } from "@/lib/transport/transport-fleet-vehicle-service";
import { requireProviderOrgId } from "@/lib/transport/transport-api-helpers";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { patchFleetVerificationsSchema } from "@/lib/validation/transport-fleet-schemas";

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
    const { verifications } = patchFleetVerificationsSchema.parse(await req.json());
    const vehicle = await patchFleetVehicleVerifications(
      user,
      orgId,
      vehicleId,
      verifications
    );
    if (!vehicle) return jsonError("Vehicle not found", 404);
    return jsonOk({ vehicle: mapFleetVehicleRecord(vehicle) });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
