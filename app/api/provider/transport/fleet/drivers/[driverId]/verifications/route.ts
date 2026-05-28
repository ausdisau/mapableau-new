import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { mapFleetDriverRecord } from "@/lib/transport/transport-fleet-api-mapper";
import { patchFleetDriverVerifications } from "@/lib/transport/transport-fleet-driver-service";
import { requireProviderOrgId } from "@/lib/transport/transport-api-helpers";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { patchFleetVerificationsSchema } from "@/lib/validation/transport-fleet-schemas";

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
    const { verifications } = patchFleetVerificationsSchema.parse(await req.json());
    const driver = await patchFleetDriverVerifications(
      user,
      orgId,
      driverId,
      verifications
    );
    if (!driver) return jsonError("Driver not found", 404);
    return jsonOk({ driver: mapFleetDriverRecord(driver) });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
