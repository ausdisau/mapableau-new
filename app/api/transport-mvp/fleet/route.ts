import { requireApiPermission } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { listOrgFleet } from "@/lib/transport-mvp/provider-inbox-service";

export async function GET(req: Request) {
  const user = await requireApiPermission("transport:read:org");
  if (user instanceof Response) return user;
  const url = new URL(req.url);
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = url.searchParams.get("organisationId") ?? orgIds[0];
  if (!organisationId || !orgIds.includes(organisationId)) {
    return jsonError("Invalid organisation", 403);
  }
  const fleet = await listOrgFleet(organisationId);
  return jsonOk(fleet);
}
