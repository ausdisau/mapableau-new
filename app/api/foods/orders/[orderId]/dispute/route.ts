import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  assertParticipantOwnsOrder,
  FoodAccessError,
} from "@/lib/foods/access-control";
import { disputeOrder, getOrderById } from "@/lib/foods/order-service";
import { disputeSchema } from "@/lib/validation/foods";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const user = await requireApiPermission("foods:manage:self");
  if (user instanceof Response) return user;
  const { orderId } = await params;
  const body = await req.json();
  const parsed = disputeSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const order = await getOrderById(orderId);
  if (!order) return jsonError("Order not found", 404);
  try {
    assertParticipantOwnsOrder(user, order);
  } catch (e) {
    if (e instanceof FoodAccessError) return jsonError(e.message, 403);
    throw e;
  }
  const updated = await disputeOrder(orderId, user.id, parsed.data.reason);
  return jsonOk({ order: updated });
}
