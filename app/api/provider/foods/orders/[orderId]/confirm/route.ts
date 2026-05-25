import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getVendorIdForUser } from "@/lib/foods/access-control";
import { providerConfirmOrder } from "@/lib/foods/order-service";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const user = await requireApiPermission("foods:manage:org");
  if (user instanceof Response) return user;
  const vendorId = await getVendorIdForUser(user.id);
  if (!vendorId) return jsonError("Vendor not found", 403);
  const { orderId } = await params;
  const order = await prisma.foodOrder.findFirst({
    where: { id: orderId, vendorId },
  });
  if (!order) return jsonError("Order not found", 404);
  const updated = await providerConfirmOrder(orderId, user.id);
  return jsonOk({ order: updated });
}
