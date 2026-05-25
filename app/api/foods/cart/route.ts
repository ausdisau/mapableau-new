import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { getOrCreateCart } from "@/lib/foods/cart-service";

export async function GET() {
  const user = await requireApiPermission("foods:read:self");
  if (user instanceof Response) return user;
  const cart = await getOrCreateCart(user.id);
  return jsonOk({ cart });
}
