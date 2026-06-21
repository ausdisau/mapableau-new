import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireShoppingEnabled } from "@/lib/shopping/guard";
import { getOrderForUser } from "@/lib/shopping/order-service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const disabled = requireShoppingEnabled();
  if (disabled) return disabled;

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;
  const order = await getOrderForUser(id, user.id);
  if (!order) return jsonError("Order not found", 404);

  return jsonOk({ order });
}
