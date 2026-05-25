import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getDriverDelivery, updateDeliveryStatus } from "@/lib/foods/delivery-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ deliveryId: string }> }
) {
  const user = await requireApiPermission("foods:deliver:assigned");
  if (user instanceof Response) return user;
  const { deliveryId } = await params;
  const d = await getDriverDelivery(deliveryId, user.id);
  if (!d) return jsonError("Delivery not found", 404);
  const result = await updateDeliveryStatus(d.orderId, "out_for_delivery", user.id);
  return jsonOk(result);
}
