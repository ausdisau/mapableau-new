import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getDeliveryAddressForRole } from "@/lib/foods/access-control";
import { getDriverDelivery } from "@/lib/foods/delivery-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ deliveryId: string }> }
) {
  const user = await requireApiPermission("foods:deliver:assigned");
  if (user instanceof Response) return user;
  const { deliveryId } = await params;
  const delivery = await getDriverDelivery(deliveryId, user.id);
  if (!delivery) return jsonError("Delivery not found", 404);
  const address = delivery.order
    ? getDeliveryAddressForRole(delivery.order, "driver")
    : null;
  return jsonOk({
    delivery: {
      id: delivery.id,
      status: delivery.status,
      trackingEvents: delivery.trackingEvents,
      handover: delivery.handover,
      order: delivery.order
        ? {
            id: delivery.order.id,
            status: delivery.order.status,
            deliveryWindowStart: delivery.order.deliveryWindowStart,
            deliveryWindowEnd: delivery.order.deliveryWindowEnd,
            deliveryAddress: address,
          }
        : null,
    },
  });
}
