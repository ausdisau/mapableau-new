import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { removeFoodCartItem, updateFoodCartItem } from "@/lib/foods/cart-service";
import { cartItemSchema } from "@/lib/validation/foods";

export async function PATCH(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const user = await requireApiPermission("foods:manage:self");
  if (user instanceof Response) return user;
  const { itemId } = await params;
  const parsed = cartItemSchema.omit({ productId: true }).safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const item = await updateFoodCartItem({ participantId: user.id, itemId, quantity: parsed.data.quantity });
  return jsonOk({ item });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const user = await requireApiPermission("foods:manage:self");
  if (user instanceof Response) return user;
  const { itemId } = await params;
  const item = await removeFoodCartItem(user.id, itemId);
  return jsonOk({ item });
}
