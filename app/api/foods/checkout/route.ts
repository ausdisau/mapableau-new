import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { checkoutFoodCart } from "@/lib/foods/order-service";
import { checkoutSchema } from "@/lib/validation/foods";

export async function POST(req: Request) {
  const user = await requireApiPermission("foods:manage:self");
  if (user instanceof Response) return user;
  const parsed = checkoutSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const order = await checkoutFoodCart({
    participantId: user.id,
    ...parsed.data,
    deliveryWindowStart: new Date(parsed.data.deliveryWindowStart),
    deliveryWindowEnd: new Date(parsed.data.deliveryWindowEnd),
  });
  return jsonOk({ orderId: order.id, paymentNextStep: "create_checkout_session" }, 201);
}
