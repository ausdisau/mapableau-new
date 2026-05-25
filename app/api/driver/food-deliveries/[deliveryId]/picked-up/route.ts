import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getDriverDelivery, updateDeliveryStatus } from "@/lib/foods/delivery-service";

async function deliveryOrderId(deliveryId: string, driverUserId: string) {
  const d = await getDriverDelivery(deliveryId, driverUserId);
  return d?.orderId ?? null;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ deliveryId: string }> }
) {
  const user = await requireApiPermission("foods:deliver:assigned");
  if (user instanceof Response) return user;
  const { deliveryId } = await params;
  const orderId = await deliveryOrderId(deliveryId, user.id);
  if (!orderId) return jsonError("Delivery not found", 404);
  const result = await updateDeliveryStatus(orderId, "picked_up", user.id);
  return jsonOk(result);
}
