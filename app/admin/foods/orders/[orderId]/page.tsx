import { notFound } from "next/navigation";

import { FoodOrderDetail } from "@/components/foods/FoodCards";
import { FoodDisputeForm } from "@/components/foods/FoodOpsActions";
import { requirePermission } from "@/lib/auth/guards";
import { getFoodOrder } from "@/lib/foods/order-service";

export default async function AdminFoodsOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  await requirePermission("foods:admin");
  const { orderId } = await params;
  const order = await getFoodOrder(orderId);
  if (!order) notFound();
  return (
    <div className="space-y-6">
      <FoodOrderDetail order={order} />
      <FoodDisputeForm orderId={order.id} />
    </div>
  );
}
