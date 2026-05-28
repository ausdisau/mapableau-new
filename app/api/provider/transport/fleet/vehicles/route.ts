import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { mapFleetVehicleRecord } from "@/lib/transport/transport-fleet-api-mapper";
import { createFleetVehicle } from "@/lib/transport/transport-fleet-vehicle-service";
import { listFleetVehicles } from "@/lib/transport/transport-fleet-read-service";
import { requireProviderOrgId } from "@/lib/transport/transport-api-helpers";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { createFleetVehicleSchema } from "@/lib/validation/transport-fleet-schemas";

export async function GET(req: Request) {
  const user = await requireApiPermission("transport:manage:org");
  if (user instanceof Response) return user;
  const orgId = new URL(req.url).searchParams.get("organisationId");
  if (!orgId) return jsonError("organisationId required", 400);
  try {
    await requireProviderOrgId(user, orgId);
    const vehicles = await listFleetVehicles(orgId);
    return jsonOk({ vehicles });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}

export async function POST(req: Request) {
  const user = await requireApiPermission("transport:manage:org");
  if (user instanceof Response) return user;
  const orgId = new URL(req.url).searchParams.get("organisationId");
  if (!orgId) return jsonError("organisationId required", 400);
  try {
    await requireProviderOrgId(user, orgId);
    const body = createFleetVehicleSchema.parse(await req.json());
    const vehicle = await createFleetVehicle(user, orgId, body);
    return jsonOk({ vehicle: mapFleetVehicleRecord(vehicle) }, 201);
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
