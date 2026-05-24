import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getFoodOrderForParticipant } from "@/lib/foods/food-order-service";

type Params = { params: Promise<{ orderId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  const { orderId } = await params;
  const order = await getFoodOrderForParticipant(orderId, user.id);
  if (!order) return jsonError("Not found", 404);
  return jsonOk({ order });
}
