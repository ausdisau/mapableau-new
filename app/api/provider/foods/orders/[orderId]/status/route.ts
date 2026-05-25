import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { assertVendorOrgAccess } from "@/lib/foods/access-control";
import { updateFoodOrderStatus } from "@/lib/foods/order-service";
import { updateFoodOrderStatusSchema } from "@/lib/validation/foods";

export async function POST(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const user = await requireApiPermission("foods:manage:org");
  if (user instanceof Response) return user;
  const { orderId } = await params;
  await assertVendorOrgAccess(orderId, user);
  const parsed = updateFoodOrderStatusSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const order = await updateFoodOrderStatus({ orderId, actorUserId: user.id, ...parsed.data });
  return jsonOk({ order });
}
