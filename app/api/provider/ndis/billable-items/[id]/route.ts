import { requireApiPermission } from "@/lib/api/auth-handler";
import { getBillableItemSafe } from "@/lib/ndis-gateway/billing/billable-item-service";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { resolveProviderOrganisationId } from "@/lib/ndis-gateway/security/org-scope";

type Params = { params: Promise<{ id: string }> };

/** GET /api/provider/ndis/billable-items/[id] */
export async function GET(req: Request, { params }: Params) {
  const user = await requireApiPermission("provider:billing:view");
  if (user instanceof Response) return user;

  const { id } = await params;
  const url = new URL(req.url);
  const organisationId = await resolveProviderOrganisationId(
    user,
    url.searchParams.get("organisationId")
  );
  if (organisationId instanceof Response) return organisationId;

  const item = await getBillableItemSafe({
    organisationId,
    billableItemId: id,
  });
  if (!item) return jsonNdisError("Billable item not found", 404);

  return jsonNdisOk({ item });
}
