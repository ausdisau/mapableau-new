import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  assertParticipantOwnsOrder,
  FoodAccessError,
} from "@/lib/foods/access-control";
import { confirmDelivery, getOrderById } from "@/lib/foods/order-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const user = await requireApiPermission("foods:manage:self");
  if (user instanceof Response) return user;
  const { orderId } = await params;
  const order = await getOrderById(orderId);
  if (!order) return jsonError("Order not found", 404);
  try {
    assertParticipantOwnsOrder(user, order);
  } catch (e) {
    if (e instanceof FoodAccessError) return jsonError(e.message, 403);
    throw e;
  }
  const updated = await confirmDelivery(orderId, user.id);
  return jsonOk({ order: updated });
}
