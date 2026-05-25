import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { checkoutOrder } from "@/lib/foods/order-service";
import { serializeFoodOrder } from "@/lib/foods/serializers";
import { checkoutSchema } from "@/lib/validation/foods";

export async function POST(req: Request) {
  const user = await requireApiPermission("foods:manage:self");
  if (user instanceof Response) return user;
  const body = await req.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    const order = await checkoutOrder(user.id, {
      deliveryAddressFull: parsed.data.deliveryAddressFull,
      deliveryAddressSuburb: parsed.data.deliveryAddressSuburb,
      deliveryAddressId: parsed.data.deliveryAddressId,
      deliveryWindowStart: new Date(parsed.data.deliveryWindowStart),
      deliveryWindowEnd: new Date(parsed.data.deliveryWindowEnd),
      handoverInstructions: parsed.data.handoverInstructions,
      substitutionPolicy: parsed.data.substitutionPolicy,
      allergenAcknowledged: parsed.data.allergenAcknowledged,
      deliveryFeeAmount: parsed.data.deliveryFeeAmount,
      preparationFeeAmount: parsed.data.preparationFeeAmount,
      supportFeeAmount: parsed.data.supportFeeAmount,
      nomineeId: parsed.data.nomineeId,
    });
    return jsonOk(
      { order: serializeFoodOrder(order, "participant") },
      201
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Checkout failed";
    return jsonError(msg, 400);
  }
}
