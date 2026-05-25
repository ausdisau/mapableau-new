import Link from "next/link";
import { notFound } from "next/navigation";

import { FoodOrderTimeline } from "@/components/foods/FoodOrderTimeline";
import { getVendorIdForUser } from "@/lib/foods/access-control";
import { requirePermission } from "@/lib/auth/guards";
import { getOrderById } from "@/lib/foods/order-service";
import { serializeFoodOrder } from "@/lib/foods/serializers";

export default async function ProviderFoodOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const user = await requirePermission("foods:read:org");
  const vendorId = await getVendorIdForUser(user.id);
  const { orderId } = await params;
  const order = await getOrderById(orderId);
  if (!order || order.vendorId !== vendorId) notFound();
  const dto = serializeFoodOrder(order, "vendor");

  return (
    <div className="space-y-4">
      <Link href="/provider/foods/orders" className="text-sm text-primary">
        ← Orders
      </Link>
      <h1 className="text-2xl font-bold">Order {orderId.slice(0, 8)}</h1>
      <pre className="rounded border p-3 text-xs">{JSON.stringify(dto.deliveryAddress, null, 2)}</pre>
      {order.events ? (
        <FoodOrderTimeline
          events={order.events.map((e) => ({
            ...e,
            createdAt: e.createdAt.toISOString(),
          }))}
        />
      ) : null}
    </div>
  );
}
