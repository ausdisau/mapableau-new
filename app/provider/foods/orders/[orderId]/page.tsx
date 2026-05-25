import { notFound } from "next/navigation";

import { FoodOrderDetail } from "@/components/foods/FoodCards";
import {
  FoodDeliveryAssignmentPanel,
  ProviderFoodOrderActions,
} from "@/components/foods/FoodOpsActions";
import { requirePermission } from "@/lib/auth/guards";
import { assertVendorOrgAccess } from "@/lib/foods/access-control";
import { getFoodOrder } from "@/lib/foods/order-service";

export default async function ProviderFoodOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const user = await requirePermission("foods:read:org");
  const { orderId } = await params;
  await assertVendorOrgAccess(orderId, user);
  const order = await getFoodOrder(orderId);
  if (!order) notFound();
  return (
    <div className="space-y-6">
      <FoodOrderDetail order={order} />
      <ProviderFoodOrderActions orderId={order.id} />
      <FoodDeliveryAssignmentPanel orderId={order.id} />
    </div>
  );
}
