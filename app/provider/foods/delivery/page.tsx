import { FoodDeliveryAssignmentPanel } from "@/components/foods/FoodDeliveryAssignmentPanel";
import { getVendorIdForUser } from "@/lib/foods/access-control";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderFoodDeliveryPage() {
  const user = await requirePermission("foods:manage:org");
  const vendorId = await getVendorIdForUser(user.id);
  const orders = vendorId
    ? await prisma.foodOrder.findMany({
        where: { vendorId, status: { in: ["packed", "confirmed", "preparing"] } },
        take: 20,
      })
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold">Delivery assignment</h1>
      <FoodDeliveryAssignmentPanel orders={orders.map((o) => ({ id: o.id, status: o.status }))} />
    </div>
  );
}
