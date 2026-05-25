import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { assertVendorOrgAccess, getVendorIdForUser } from "@/lib/foods/access-control";
import { updateVendorProduct } from "@/lib/foods/catalog-service";
import { prisma } from "@/lib/prisma";
import { updateProductSchema } from "@/lib/validation/foods";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const user = await requireApiPermission("foods:manage:org");
  if (user instanceof Response) return user;
  const vendorId = await getVendorIdForUser(user.id);
  if (!vendorId) return jsonError("Vendor not found", 403);
  const { productId } = await params;
  const product = await prisma.foodProduct.findFirst({
    where: { id: productId, vendorId },
  });
  if (!product) return jsonError("Product not found", 404);
  const vendor = await prisma.foodVendor.findUnique({
    where: { id: vendorId },
    select: { organisationId: true },
  });
  if (vendor) await assertVendorOrgAccess(user, vendor.organisationId);
  const body = await req.json();
  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const updated = await updateVendorProduct(vendorId, productId, parsed.data);
  return jsonOk({ product: updated });
}
