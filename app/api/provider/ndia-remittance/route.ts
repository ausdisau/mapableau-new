import { requireApiPermission } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { listNdiaRemittanceImports } from "@/lib/ndia/remittance/remittance-service";

export async function GET(req: Request) {
  const user = await requireApiPermission("provider:ndia:claim");
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  let organisationId = url.searchParams.get("organisationId");
  if (!organisationId) {
    const orgIds = await getUserOrganisationIds(user.id);
    organisationId = orgIds[0] ?? null;
  }
  if (!organisationId) {
    return jsonError("organisationId required", 400);
  }

  const imports = await listNdiaRemittanceImports(organisationId);
  return jsonOk({ imports });
}
