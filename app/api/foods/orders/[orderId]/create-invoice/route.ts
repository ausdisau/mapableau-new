import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { createFoodInvoice } from "@/lib/foods/invoice-service";

export async function POST(_req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const user = await requireApiPermission("foods:manage:self");
  if (user instanceof Response) return user;
  const { orderId } = await params;
  const invoice = await createFoodInvoice({ orderId, actorUserId: user.id });
  return jsonOk({ invoice }, 201);
}
