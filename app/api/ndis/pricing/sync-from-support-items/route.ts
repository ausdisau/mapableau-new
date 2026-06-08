import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { syncPricingCatalogueFromSupportItems } from "@/lib/ndis/claiming/catalogue-sync";

/** Sync NdisPricingCatalogueItem rows from active NdisSupportItem records. */
export async function POST() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const result = await syncPricingCatalogueFromSupportItems();
  return jsonOk(result);
}
