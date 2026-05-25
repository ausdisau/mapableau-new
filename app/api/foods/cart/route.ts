import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { addFoodCartItem, getParticipantFoodCart } from "@/lib/foods/cart-service";
import { cartItemSchema } from "@/lib/validation/foods";

export async function GET() {
  const user = await requireApiPermission("foods:read:self");
  if (user instanceof Response) return user;
  const cart = await getParticipantFoodCart(user.id);
  return jsonOk({ cart });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("foods:manage:self");
  if (user instanceof Response) return user;
  const parsed = cartItemSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const item = await addFoodCartItem({ participantId: user.id, ...parsed.data });
  return jsonOk({ item }, 201);
}
