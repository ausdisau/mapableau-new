import { jsonOk } from "@/lib/api/response";
import { requireShoppingEnabled } from "@/lib/shopping/guard";
import { listPublishedProducts } from "@/lib/shopping/product-service";
import { listProductsQuerySchema } from "@/lib/shopping/schemas";

export async function GET(req: Request) {
  const disabled = requireShoppingEnabled();
  if (disabled) return disabled;

  const url = new URL(req.url);
  const parsed = listProductsQuerySchema.safeParse({
    category: url.searchParams.get("category") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await listPublishedProducts(parsed.data);
  return jsonOk(result);
}
