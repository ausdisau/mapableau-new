import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  CareSupportAccessError,
  canUseCoordinatorPortal,
} from "@/lib/care-support/access-control";
import {
  getReferralById,
  submitReferral,
  updateReferral,
} from "@/lib/care-support/referral-service";
import { updateReferralSchema } from "@/schemas/care-support";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await context.params;
  const referral = await getReferralById(id);
  if (!referral) return jsonError("Not found", 404);

  if (referral.participantId !== user.id && !canUseCoordinatorPortal(user)) {
    return jsonError("Forbidden", 403);
  }

  return jsonOk({ referral });
}

export async function PATCH(req: Request, context: RouteContext) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await context.params;

  try {
    const body = updateReferralSchema.parse(await req.json());
    const existing = await getReferralById(id);
    if (!existing) return jsonError("Not found", 404);

    const asCoordinator =
      existing.participantId !== user.id && canUseCoordinatorPortal(user);

    if (body.status === "submitted" && existing.participantId === user.id) {
      const submitted = await submitReferral(id, user.id);
      return jsonOk({ referral: submitted });
    }

    const referral = await updateReferral({
      referralId: id,
      actorUserId: user.id,
      status: body.status,
      priority: body.priority,
      summary: body.summary,
      destinationJson: body.destinationJson as Record<string, unknown> | undefined,
      careRequestId: body.careRequestId,
      asCoordinator,
    });
    return jsonOk({ referral });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof CareSupportAccessError) return jsonError(e.message, 403);
    return jsonError("Update failed", 500);
  }
}
