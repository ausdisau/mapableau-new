import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  getTransportVehicle,
  updateTransportVehicle,
} from "@/lib/transport/transport-fleet-service";
import { requireProviderOrgId } from "@/lib/transport/transport-api-helpers";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { updateTransportVehicleSchema } from "@/lib/validation/transport-fleet-schemas";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  const user = await requireApiPermission("transport:read:org");
  if (user instanceof Response) return user;
  const orgId = new URL(req.url).searchParams.get("organisationId");
  if (!orgId) return jsonError("organisationId required", 400);
  const { vehicleId } = await params;
  try {
    await requireProviderOrgId(user, orgId);
    return jsonOk(await getTransportVehicle(user, orgId, vehicleId));
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
    const body = updateTransportVehicleSchema.parse(await req.json());
    return jsonOk(await updateTransportVehicle(user, orgId, vehicleId, body));
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
