import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { accessDeniedMessage } from "@/lib/access/role-policy";
import { createReferral } from "@/lib/support-coordination/referral-service";
import { createReferralSchema } from "@/lib/validation/support-coordination";

export async function POST(req: Request) {
  const user = await requireApiPermission("coordinator:portal");
  if (user instanceof Response) return user;

  try {
    const body = createReferralSchema.parse(await req.json());
    const referral = await createReferral({
      coordinatorId: user.id,
      participantId: body.participantId,
      actorRole: user.primaryRole,
      title: body.title,
      description: body.description,
      providerId: body.providerId,
      organisationId: body.organisationId,
    });
    return jsonOk({ referral }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "CONSENT_REQUIRED") {
      return jsonError(accessDeniedMessage("no_consent"), 403);
    }
    return jsonError("Could not create referral", 400);
  }
}
