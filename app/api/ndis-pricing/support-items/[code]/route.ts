import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  getSupportItemByCode,
  toSupportItemSummary,
} from "@/lib/ndis-pricing/support-item-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { code } = await params;
  const result = await getSupportItemByCode(decodeURIComponent(code));
  if (!result) return jsonError("Support item not found", 404);

  return jsonOk({
    item: toSupportItemSummary(result.item),
    priceHistory: result.item.cataloguePrices.map((p) => ({
      priceCapCents: p.priceCapCents,
      unitType: p.unitType,
      effectiveFrom: p.effectiveFrom,
      version: p.version.version,
      catalogueName: p.version.catalogue.name,
    })),
    warnings: result.warnings,
    disclaimer: result.disclaimer,
  });
}
