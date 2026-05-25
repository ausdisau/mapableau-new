import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { recordFoodHandover } from "@/lib/foods/handover-service";

export async function POST(req: Request, { params }: { params: Promise<{ deliveryId: string }> }) {
  const user = await requireApiPermission("foods:deliver:assigned");
  if (user instanceof Response) return user;
  const { deliveryId } = await params;
  const body = await req.json();
  const handover = await recordFoodHandover({ assignmentId: deliveryId, recordedById: user.id, checklist: body.checklist ?? {}, notes: body.notes, photoUrl: body.photoUrl });
  return jsonOk({ handover }, 201);
}
