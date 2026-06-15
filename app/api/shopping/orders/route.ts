import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { requireShoppingEnabled } from "@/lib/shopping/guard";
import { listOrdersForUser } from "@/lib/shopping/order-service";

export async function GET() {
  const disabled = requireShoppingEnabled();
  if (disabled) return disabled;

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const orders = await listOrdersForUser(user.id);
  return jsonOk({ orders });
}
