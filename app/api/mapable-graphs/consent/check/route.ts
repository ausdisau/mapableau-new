import { ZodError } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requireGraphParticipantAccess } from "@/lib/mapable-graphs/api-auth";
import { consentCheckSchema } from "@/lib/mapable-graphs/schemas";
import {
  checkConsentForAction,
  grantConsentScope,
} from "@/lib/mapable-graphs/service";

export async function POST(req: Request) {
  try {
    const body = consentCheckSchema.parse(await req.json());
    const access = await requireGraphParticipantAccess(body.participantId);
    if (access instanceof Response) return access;

    const check = await checkConsentForAction({
      participantId: body.participantId,
      scope: body.scope,
      grantedToUserId: body.recipientId,
    });

    if (!check.allowed && body.mode && body.mode !== "deny") {
      if (body.mode === "once" || body.mode === "always") {
        await grantConsentScope(
          body.participantId,
          body.scope,
          body.recipientId,
          body.mode
        );
        const recheck = await checkConsentForAction({
          participantId: body.participantId,
          scope: body.scope,
          grantedToUserId: body.recipientId,
        });
        return jsonOk({
          allowed: recheck.allowed,
          requiresSharingCard: !recheck.allowed,
          minimumNecessaryOnly: true,
          scope: body.scope,
          message: recheck.allowed
            ? "Consent recorded for this share."
            : "Please confirm what to share using the consent card.",
        });
      }
    }

    return jsonOk({
      allowed: check.allowed,
      requiresSharingCard: !check.allowed,
      minimumNecessaryOnly: true,
      scope: body.scope,
      details: check,
      message: check.allowed
        ? "You have already allowed this sharing scope."
        : "Consent is required before sharing. Choose share once, always, or do not share.",
    });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Consent check failed", 500);
  }
}
