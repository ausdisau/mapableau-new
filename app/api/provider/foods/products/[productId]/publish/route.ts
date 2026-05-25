import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getVendorIdForUser } from "@/lib/foods/access-control";
import { publishProduct } from "@/lib/foods/catalog-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const user = await requireApiPermission("foods:manage:org");
  if (user instanceof Response) return user;
  const vendorId = await getVendorIdForUser(user.id);
  if (!vendorId) return jsonError("Vendor not found", 403);
  const { productId } = await params;
  try {
    const product = await publishProduct(vendorId, productId);
    return jsonOk({ product });
  } catch {
    return jsonError("Product not found", 404);
  }
}
