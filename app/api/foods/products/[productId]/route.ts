import { jsonError, jsonOk } from "@/lib/api/response";
import { getProduct } from "@/lib/foods/catalog-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
  const product = await getProduct(productId);
  if (!product) return jsonError("Product not found", 404);
  return jsonOk({ product });
}
