import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getVendorIdForUser } from "@/lib/foods/access-control";
import { serializeFoodOrder } from "@/lib/foods/serializers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiPermission("foods:read:org");
  if (user instanceof Response) return user;
  const vendorId = await getVendorIdForUser(user.id);
  if (!vendorId) return jsonError("Vendor not found", 403);
  const orders = await prisma.foodOrder.findMany({
    where: { vendorId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: true, delivery: true },
  });
  return jsonOk({
    orders: orders.map((o) => serializeFoodOrder(o, "vendor")),
  });
}
