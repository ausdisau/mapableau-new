import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { getVendorIdForUser } from "@/lib/foods/access-control";
import { prisma } from "@/lib/prisma";
import { inventoryUpdateSchema } from "@/lib/validation/foods";

export async function POST(req: Request) {
  const user = await requireApiPermission("foods:manage:org");
  if (user instanceof Response) return user;
  const vendorId = await getVendorIdForUser(user.id);
  if (!vendorId) return jsonError("Vendor not found", 403);
  const body = await req.json();
  const parsed = inventoryUpdateSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const product = await prisma.foodProduct.findFirst({
    where: { id: parsed.data.productId, vendorId },
  });
  if (!product) return jsonError("Product not found", 404);
  const inventory = await prisma.foodInventory.upsert({
    where: { productId: parsed.data.productId },
    create: {
      vendorId,
      productId: parsed.data.productId,
      quantityOnHand: parsed.data.quantityOnHand,
    },
    update: { quantityOnHand: parsed.data.quantityOnHand },
  });
  return jsonOk({ inventory });
}
