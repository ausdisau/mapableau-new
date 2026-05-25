import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { foodErrorResponse } from "@/lib/foods/api-errors";
import { updateFoodDeliveryStatus } from "@/lib/foods/delivery-service";
import { updateFoodDeliveryStatusSchema } from "@/lib/validation/foods";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const user = await requireApiPermission("foods:deliver:assigned");
  if (user instanceof Response) return user;
  try {
    const { assignmentId } = await params;
    const parsed = updateFoodDeliveryStatusSchema.parse(await req.json());
    const assignment = await updateFoodDeliveryStatus({
      assignmentId,
      actorUserId: user.id,
      ...parsed,
    });
    return jsonOk({ assignment });
  } catch (error) {
    return foodErrorResponse(error);
  }
}
