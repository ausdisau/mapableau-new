import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { confirmFoodOrderDelivery } from "@/lib/foods/order-service";

export async function POST(_req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const user = await requireApiPermission("foods:manage:self");
  if (user instanceof Response) return user;
  const { orderId } = await params;
  const order = await confirmFoodOrderDelivery(orderId, user.id);
  return jsonOk({ order });
}
