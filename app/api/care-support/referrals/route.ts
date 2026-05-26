import { ZodError } from "zod";

import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  CareSupportAccessError,
  canUseCoordinatorPortal,
} from "@/lib/care-support/access-control";
import { createReferral, listReferralsForParticipant } from "@/lib/care-support/referral-service";
import { assertCoordinatorCanAccessParticipant } from "@/lib/care-support/access-control";
import { createReferralSchema } from "@/schemas/care-support";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const participantId = url.searchParams.get("participantId") ?? user.id;

  try {
    if (participantId !== user.id) {
      if (!canUseCoordinatorPortal(user)) return jsonError("Forbidden", 403);
      await assertCoordinatorCanAccessParticipant(
        user.id,
        participantId,
        "care_support.referral_manage"
      );
    }
    const referrals = await listReferralsForParticipant(participantId);
    return jsonOk({ referrals });
  } catch (e) {
    if (e instanceof CareSupportAccessError) return jsonError(e.message, 403);
    return jsonError("List failed", 500);
  }
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const body = createReferralSchema.parse(await req.json());
    const asCoordinator =
      Boolean(body.participantId && body.participantId !== user.id) &&
      canUseCoordinatorPortal(user);

    if (!asCoordinator) {
      const perm = await requireApiPermission("care:manage:self");
      if (perm instanceof Response) return perm;
    }

    const participantId = asCoordinator ? body.participantId! : user.id;

    const referral = await createReferral({
      participantId,
      createdById: user.id,
      referralType: body.referralType,
      summary: body.summary,
      assessmentId: body.assessmentId,
      priority: body.priority,
      destinationJson: body.destinationJson as Record<string, unknown> | undefined,
      asCoordinator,
    });
    return jsonOk({ referral }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof CareSupportAccessError) return jsonError(e.message, 403);
    return jsonError("Create failed", 500);
  }
}
