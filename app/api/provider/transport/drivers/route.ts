import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  createTransportDriver,
  listTransportDrivers,
} from "@/lib/transport/transport-fleet-service";
import { requireProviderOrgId } from "@/lib/transport/transport-api-helpers";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import { createTransportDriverSchema } from "@/lib/validation/transport-fleet-schemas";

export async function GET(req: Request) {
  const user = await requireApiPermission("transport:read:org");
  if (user instanceof Response) return user;
  const orgId = new URL(req.url).searchParams.get("organisationId");
  if (!orgId) return jsonError("organisationId required", 400);
  try {
    await requireProviderOrgId(user, orgId);
    return jsonOk({ drivers: await listTransportDrivers(user, orgId) });
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
    const body = createTransportDriverSchema.parse(await req.json());
    return jsonOk(await createTransportDriver(user, orgId, body));
  } catch (e) {
    return handleTransportRouteError(e);
  }
}
