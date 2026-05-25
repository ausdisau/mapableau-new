import { notFound } from "next/navigation";

import { DriverFoodDeliveryScreen } from "@/components/foods/DriverFoodDeliveryScreen";
import { requirePermission } from "@/lib/auth/guards";
import { getDriverDelivery } from "@/lib/foods/delivery-service";

export default async function DriverFoodDeliveryDetailPage({
  params,
}: {
  params: Promise<{ deliveryId: string }>;
}) {
  const user = await requirePermission("foods:deliver:assigned");
  const { deliveryId } = await params;
  const delivery = await getDriverDelivery(deliveryId, user.id);
  if (!delivery) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <DriverFoodDeliveryScreen
        delivery={{
          id: delivery.id,
          status: delivery.status,
          order: delivery.order
            ? {
                id: delivery.order.id,
                status: delivery.order.status,
                deliveryStatus: delivery.order.deliveryStatus,
                deliveryWindowStart: delivery.order.deliveryWindowStart?.toISOString(),
                deliveryWindowEnd: delivery.order.deliveryWindowEnd?.toISOString(),
              }
            : undefined,
        }}
      />
    </div>
  );
}
