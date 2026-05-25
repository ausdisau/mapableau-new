import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  assertParticipantOwnsOrder,
  FoodAccessError,
} from "@/lib/foods/access-control";
import { getOrderById } from "@/lib/foods/order-service";
import { createFoodPaymentSession } from "@/lib/foods/payment-service";

export async function POST(
  req: Request,
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
  const body = await req.json().catch(() => ({}));
  const origin = new URL(req.url).origin;
  try {
    const session = await createFoodPaymentSession({
      orderId,
      actorUserId: user.id,
      successUrl:
        body.successUrl ?? `${origin}/foods/orders/${orderId}?paid=1`,
      cancelUrl: body.cancelUrl ?? `${origin}/foods/orders/${orderId}`,
    });
    return jsonOk(session);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Payment not allowed";
    return jsonError(msg, 409);
  }
}
