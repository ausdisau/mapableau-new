import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getMenuItem } from "@/lib/foods/food-order-service";

type Params = { params: Promise<{ menuItemId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { menuItemId } = await params;
  const item = await getMenuItem(menuItemId);
  if (!item) return jsonError("Not found", 404);
  return jsonOk({ item });
}
