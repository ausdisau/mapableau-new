import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listDriverDeliveries } from "@/lib/foods/delivery-service";
import { getDeliveryAddressForRole } from "@/lib/foods/access-control";

export async function GET() {
  const user = await requireApiPermission("foods:deliver:assigned");
  if (user instanceof Response) return user;
  const deliveries = await listDriverDeliveries(user.id);
  return jsonOk({
    deliveries: deliveries.map((d) => ({
      id: d.id,
      status: d.status,
      order: d.order
        ? {
            id: d.order.id,
            deliveryWindowStart: d.order.deliveryWindowStart,
            deliveryWindowEnd: d.order.deliveryWindowEnd,
            deliveryAddress: getDeliveryAddressForRole(d.order, "driver"),
            handoverInstructions: d.order.handoverInstructionsJson,
          }
        : null,
    })),
  });
}
