import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { listActiveMenu } from "@/lib/foods/food-order-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const menu = await listActiveMenu();
  return jsonOk({ menu });
}
