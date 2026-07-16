import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { upsertVehicleVerifications } from "@/lib/transport/transport-fleet-service";
import { requireProviderOrgId } from "@/lib/transport/transport-api-helpers";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { upsertVehicleVerificationsSchema } from "@/lib/validation/transport-fleet-schemas";

export async function PUT(
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
    const body = upsertVehicleVerificationsSchema.parse(await req.json());
    return jsonOk(
      await upsertVehicleVerifications(user, orgId, vehicleId, body.verifications)
    );
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
