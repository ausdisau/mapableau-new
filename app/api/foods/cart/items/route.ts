import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { addCartItem } from "@/lib/foods/cart-service";
import { addCartItemSchema } from "@/lib/validation/foods";

export async function POST(req: Request) {
  const user = await requireApiPermission("foods:manage:self");
  if (user instanceof Response) return user;
  const body = await req.json();
  const parsed = addCartItemSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    const cart = await addCartItem(
      user.id,
      parsed.data.productId,
      parsed.data.quantity
    );
    return jsonOk({ cart }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return jsonError(msg, 400);
  }
}
