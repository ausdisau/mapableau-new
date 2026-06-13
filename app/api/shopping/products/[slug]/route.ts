import { jsonError, jsonOk } from "@/lib/api/response";
import { requireShoppingEnabled } from "@/lib/shopping/guard";
import { getPublishedProductBySlug } from "@/lib/shopping/product-service";

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const disabled = requireShoppingEnabled();
  if (disabled) return disabled;

  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) return jsonError("Product not found", 404);

  return jsonOk({ product });
}
