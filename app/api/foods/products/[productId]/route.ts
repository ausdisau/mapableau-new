import { jsonError, jsonOk } from "@/lib/api/response";
import { getFoodProduct } from "@/lib/foods/catalog-service";

export async function GET(_req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const product = await getFoodProduct(productId);
  if (!product?.published) return jsonError("Not found", 404);
  return jsonOk({ product });
}
