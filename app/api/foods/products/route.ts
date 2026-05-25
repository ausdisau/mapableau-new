import { jsonOk } from "@/lib/api/response";
import { listPublishedProducts } from "@/lib/foods/catalog-service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const products = await listPublishedProducts({
    category: searchParams.get("category") ?? undefined,
    productType: searchParams.get("productType") ?? undefined,
    dietaryTag: searchParams.get("dietaryTag") ?? undefined,
    accessibilityTag: searchParams.get("accessibilityTag") ?? undefined,
    vendorId: searchParams.get("vendorId") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  });
  return jsonOk({ products });
}
