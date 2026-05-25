import { ZodError } from "zod";

import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { updateReferralStatus } from "@/lib/support-coordination/referral-service";
import { updateReferralSchema } from "@/lib/validation/support-coordination";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;

  try {
    const body = updateReferralSchema.parse(await req.json());
    const referral = await updateReferralStatus({
      referralId: id,
      actorUserId: user.id,
      actorRole: user.primaryRole,
      status: body.status,
      bookingId: body.bookingId,
      notes: body.notes,
    });
    return jsonOk({ referral });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error) {
      if (e.message === "PARTICIPANT_APPROVAL_REQUIRED") {
        return jsonError(
          "Participant approval is required before this referral can proceed.",
          403
        );
      }
      if (e.message === "NOT_FOUND") return jsonError("Referral not found", 404);
      if (e.message === "FORBIDDEN") return jsonError("Access denied", 403);
    }
    return jsonError("Could not update referral", 400);
  }
}
