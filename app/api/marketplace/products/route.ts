import { jsonOk } from "@/lib/api/response";
import { listMarketplaceProducts } from "@/lib/marketplace/catalog";
import {
  MARKETPLACE_CATEGORIES,
  type MarketplaceCategorySlug,
} from "@/lib/marketplace/types";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as MarketplaceCategorySlug | null;
  const validCategory = MARKETPLACE_CATEGORIES.some((c) => c.slug === category)
    ? category
    : undefined;

  return jsonOk({
    categories: MARKETPLACE_CATEGORIES,
    products: listMarketplaceProducts(validCategory ?? undefined),
  });
}
