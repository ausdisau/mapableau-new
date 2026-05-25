import { notFound } from "next/navigation";

import { FoodDisputeForm } from "@/components/foods/FoodDisputeForm";
import { FoodOrderDetail } from "@/components/foods/FoodOrderDetail";
import { FoodSafetyIssueReport } from "@/components/foods/FoodSafetyIssueReport";
import {
  assertParticipantOwnsOrder,
  FoodAccessError,
} from "@/lib/foods/access-control";
import { requirePermission } from "@/lib/auth/guards";
import { getOrderById } from "@/lib/foods/order-service";
import { serializeFoodOrder } from "@/lib/foods/serializers";

export default async function FoodOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const user = await requirePermission("foods:read:self");
  const { orderId } = await params;
  const order = await getOrderById(orderId);
  if (!order) notFound();
  try {
    assertParticipantOwnsOrder(user, order);
  } catch (e) {
    if (e instanceof FoodAccessError) notFound();
    throw e;
  }
  const dto = serializeFoodOrder(order, "participant");

  return (
    <div className="space-y-8">
      <FoodOrderDetail order={dto as never} />
      <FoodDisputeForm orderId={orderId} />
      <FoodSafetyIssueReport orderId={orderId} />
    </div>
  );
}
