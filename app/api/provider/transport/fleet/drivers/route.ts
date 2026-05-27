import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { mapFleetDriverRecord } from "@/lib/transport/transport-fleet-api-mapper";
import { createFleetDriver } from "@/lib/transport/transport-fleet-driver-service";
import { listFleetDrivers } from "@/lib/transport/transport-fleet-read-service";
import { requireProviderOrgId } from "@/lib/transport/transport-api-helpers";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { createFleetDriverSchema } from "@/lib/validation/transport-fleet-schemas";

export async function GET(req: Request) {
  const user = await requireApiPermission("transport:manage:org");
  if (user instanceof Response) return user;
  const orgId = new URL(req.url).searchParams.get("organisationId");
  if (!orgId) return jsonError("organisationId required", 400);
  try {
    await requireProviderOrgId(user, orgId);
    const drivers = await listFleetDrivers(orgId);
    return jsonOk({ drivers });
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
    const body = createFleetDriverSchema.parse(await req.json());
    const driver = await createFleetDriver(user, orgId, body);
    return jsonOk({ driver: mapFleetDriverRecord(driver) }, 201);
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
