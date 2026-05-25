import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { getVendorIdForUser } from "@/lib/foods/access-control";
import { createVendorProduct } from "@/lib/foods/catalog-service";
import { createProductSchema } from "@/lib/validation/foods";

export async function POST(req: Request) {
  const user = await requireApiPermission("foods:manage:org");
  if (user instanceof Response) return user;
  const vendorId = await getVendorIdForUser(user.id);
  if (!vendorId) return jsonError("Food vendor not linked to organisation", 403);
  const body = await req.json();
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const product = await createVendorProduct(vendorId, parsed.data);
  return jsonOk({ product }, 201);
}
