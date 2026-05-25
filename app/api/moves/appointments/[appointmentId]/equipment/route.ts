import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { addEquipmentRecommendation } from "@/lib/moves/rehab-plan-service";
import { equipmentRecommendationSchema } from "@/lib/validation/moves";

type Params = { params: Promise<{ appointmentId: string }> };

export async function POST(req: Request, { params }: Params) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { appointmentId } = await params;
  try {
    const parsed = equipmentRecommendationSchema.parse(await req.json());
    const rec = await addEquipmentRecommendation({
      therapyAppointmentId: appointmentId,
      itemName: parsed.itemName,
      marketplaceUrl: parsed.marketplaceUrl,
      notes: parsed.notes,
      actorUserId: user.id,
    });
    return jsonOk({ recommendation: rec }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Recommendation failed", 500);
  }
}
