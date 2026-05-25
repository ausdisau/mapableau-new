import { FoodOrderQueue } from "@/components/foods/FoodOrderQueue";
import { getVendorIdForUser } from "@/lib/foods/access-control";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderFoodOrdersPage() {
  const user = await requirePermission("foods:read:org");
  const vendorId = await getVendorIdForUser(user.id);
  const orders = vendorId
    ? await prisma.foodOrder.findMany({
        where: { vendorId },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold">Order queue</h1>
      <FoodOrderQueue
        orders={orders.map((o) => ({
          id: o.id,
          status: o.status,
          totalAmount: o.totalAmount,
          createdAt: o.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
