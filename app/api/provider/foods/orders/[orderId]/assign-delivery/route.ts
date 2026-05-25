import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { assertVendorOrgAccess } from "@/lib/foods/access-control";
import { foodErrorResponse } from "@/lib/foods/api-errors";
import { assignFoodDelivery } from "@/lib/foods/delivery-service";
import { assignFoodDeliverySchema } from "@/lib/validation/foods";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const user = await requireApiPermission("foods:manage:org");
  if (user instanceof Response) return user;
  try {
    const { orderId } = await params;
    await assertVendorOrgAccess(orderId, user);
    const parsed = assignFoodDeliverySchema.parse(await req.json());
    const assignment = await assignFoodDelivery({
      orderId,
      actorUserId: user.id,
      ...parsed,
    });
    return jsonOk({ assignment });
  } catch (error) {
    return foodErrorResponse(error);
  }
}
