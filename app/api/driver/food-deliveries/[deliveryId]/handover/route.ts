import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { getDriverDelivery } from "@/lib/foods/delivery-service";
import { recordHandover } from "@/lib/foods/handover-service";
import { handoverSchema } from "@/lib/validation/foods";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ deliveryId: string }> }
) {
  const user = await requireApiPermission("foods:deliver:assigned");
  if (user instanceof Response) return user;
  const { deliveryId } = await params;
  const d = await getDriverDelivery(deliveryId, user.id);
  if (!d) return jsonError("Delivery not found", 404);
  const body = await req.json();
  const parsed = handoverSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  try {
    const assignment = await recordHandover(d.orderId, user.id, {
      checklist: parsed.data.checklist,
      photoUrl: parsed.data.photoUrl,
      recipientName: parsed.data.recipientName,
      notes: parsed.data.notes,
    });
    return jsonOk({ assignment });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Handover failed";
    return jsonError(msg, 400);
  }
}
