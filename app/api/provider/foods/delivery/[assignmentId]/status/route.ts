import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { updateFoodDeliveryStatus } from "@/lib/foods/delivery-service";
import { updateFoodDeliveryStatusSchema } from "@/lib/validation/foods";

export async function POST(req: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  const user = await requireApiPermission("foods:manage:org");
  if (user instanceof Response) return user;
  const parsed = updateFoodDeliveryStatusSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);
  const { assignmentId } = await params;
  const assignment = await updateFoodDeliveryStatus({ assignmentId, actorUserId: user.id, ...parsed.data });
  return jsonOk({ assignment });
}
