import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { removeCartItem, updateCartItem } from "@/lib/foods/cart-service";
import { updateCartItemSchema } from "@/lib/validation/foods";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const user = await requireApiPermission("foods:manage:self");
  if (user instanceof Response) return user;
  const { itemId } = await params;
  const body = await req.json();
  const parsed = updateCartItemSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    const cart = await updateCartItem(user.id, itemId, parsed.data.quantity);
    return jsonOk({ cart });
  } catch {
    return jsonError("Cart item not found", 404);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const user = await requireApiPermission("foods:manage:self");
  if (user instanceof Response) return user;
  const { itemId } = await params;
  try {
    const cart = await removeCartItem(user.id, itemId);
    return jsonOk({ cart });
  } catch {
    return jsonError("Cart item not found", 404);
  }
}
