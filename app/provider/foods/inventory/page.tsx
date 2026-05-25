import { FoodInventoryTable } from "@/components/foods/FoodInventoryTable";
import { getVendorIdForUser } from "@/lib/foods/access-control";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderFoodInventoryPage() {
  const user = await requirePermission("foods:read:org");
  const vendorId = await getVendorIdForUser(user.id);
  const inventory = vendorId
    ? await prisma.foodInventory.findMany({
        where: { vendorId },
        include: { product: { select: { title: true } } },
      })
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold">Inventory</h1>
      <FoodInventoryTable
        rows={inventory.map((i) => ({
          productId: i.productId,
          title: i.product.title,
          quantityOnHand: i.quantityOnHand,
        }))}
      />
    </div>
  );
}
