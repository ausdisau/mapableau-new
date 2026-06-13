import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requireShoppingEnabled } from "@/lib/shopping/guard";
import { getCartView, setCartItemQuantity } from "@/lib/shopping/cart-service";
import { cartItemMutationSchema } from "@/lib/shopping/schemas";

export async function GET() {
  const disabled = requireShoppingEnabled();
  if (disabled) return disabled;

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  return jsonOk({ cart: await getCartView(user.id) });
}

export async function POST(req: Request) {
  const disabled = requireShoppingEnabled();
  if (disabled) return disabled;

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json();
  const parsed = cartItemMutationSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await setCartItemQuantity(
    user.id,
    parsed.data.productId,
    parsed.data.quantity
  );

  if (!result.ok) return jsonError(result.error, 400);
  return jsonOk({ cart: result.cart });
}
