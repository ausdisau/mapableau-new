import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { disputeFoodOrder } from "@/lib/foods/order-service";
import { foodDisputeSchema } from "@/lib/validation/foods";

export async function POST(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const user = await requireApiPermission("foods:manage:self");
  if (user instanceof Response) return user;
  const parsed = foodDisputeSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { orderId } = await params;
  const order = await disputeFoodOrder(orderId, user.id, parsed.data.reason);
  return jsonOk({ order });
}
