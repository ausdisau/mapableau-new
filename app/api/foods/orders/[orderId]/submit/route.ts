import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { submitFoodOrder } from "@/lib/foods/food-order-service";

type Params = { params: Promise<{ orderId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const user = await requireApiPermission("care:manage:self");
  if (user instanceof Response) return user;
  const { orderId } = await params;
  try {
    const order = await submitFoodOrder(orderId, user.id);
    return jsonOk({ order });
  } catch {
    return jsonError("Submit failed", 500);
  }
}
