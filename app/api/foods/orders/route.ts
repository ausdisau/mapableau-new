import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listParticipantOrders } from "@/lib/foods/order-service";
import { serializeFoodOrder } from "@/lib/foods/serializers";

export async function GET() {
  const user = await requireApiPermission("foods:read:self");
  if (user instanceof Response) return user;
  const orders = await listParticipantOrders(user.id);
  return jsonOk({
    orders: orders.map((o) => serializeFoodOrder(o, "participant")),
  });
}
