import { z } from "zod";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createDraftFromCareShift } from "@/lib/billing-core/transparent-billing";

const schema = z.object({
  careShiftId: z.string().min(1),
  providerId: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  try {
    const body = schema.parse(await req.json());
    const invoice = await createDraftFromCareShift({
      careShiftId: body.careShiftId,
      actorUserId: user.id,
      providerId: body.providerId,
    });
    return jsonOk({ invoice }, 201);
  } catch (e) {
    if (e instanceof z.ZodError) return zodErrorResponse(e);
    if (e instanceof Error) {
      if (e.message === "NOT_FOUND") return jsonError("Care shift not found", 404);
      if (e.message === "EVIDENCE_REQUIRED") {
        return jsonError("Care shift has no service log evidence", 400);
      }
      if (e.message === "TRANSPARENT_BILLING_DISABLED") {
        return jsonError("Transparent billing is disabled", 400);
      }
    }
    return jsonError("Could not create invoice from care shift", 400);
  }
}
