import { jsonError, jsonOk } from "@/lib/api/response";
import { getMarketplaceProduct } from "@/lib/marketplace/catalog";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  const product = getMarketplaceProduct(productId);
  if (!product) return jsonError("Product not found", 404);
  return jsonOk({ product });
}
