import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { createFoodPaymentSession } from "@/lib/foods/payment-service";

export async function POST(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const user = await requireApiPermission("foods:manage:self");
  if (user instanceof Response) return user;
  const { orderId } = await params;
  const body = await req.json().catch(() => ({}));
  const session = await createFoodPaymentSession({ orderId, participantId: user.id, successUrl: body.successUrl ?? `${new URL(req.url).origin}/foods/orders/${orderId}`, cancelUrl: body.cancelUrl ?? `${new URL(req.url).origin}/foods/orders/${orderId}` });
  return jsonOk(session, 201);
}
