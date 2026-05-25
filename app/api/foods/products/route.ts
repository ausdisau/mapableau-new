import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { listPublishedFoodProducts } from "@/lib/foods/catalog-service";
import { foodProductQuerySchema } from "@/lib/validation/foods";

export async function GET(req: Request) {
  const user = await requireApiPermission("foods:read:self");
  if (user instanceof Response) return user;
  const parsed = foodProductQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const products = await listPublishedFoodProducts(parsed.data);
  return jsonOk({ products });
}
