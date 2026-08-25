import { ZodError } from "zod";
import { accessCompatibilityRequestSchema } from "@mapable/contracts";

import {
  accessInfrastructureFlags,
  evaluateEntityCompatibility,
} from "@/lib/access/infrastructure";
import { requireApiSession } from "@/lib/api/auth-handler";
import { isResponse, jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";

export const dynamic = "force-dynamic";

/**
 * POST deterministic place/entity compatibility for the signed-in participant.
 * decisionOwner is always PARTICIPANT.
 */
export async function POST(req: Request) {
  if (!accessInfrastructureFlags.compatibilityEngine) {
    return jsonError("Access Compatibility Engine is disabled", 404);
  }

  const user = await requireApiSession();
  if (isResponse(user)) return user;

  try {
    const body = accessCompatibilityRequestSchema.parse(await req.json());
    const result = await evaluateEntityCompatibility({
      userId: user.id,
      entityType: body.entityType,
      entityId: body.entityId,
      activity: body.context?.activity,
      journeyId: body.context?.journeyId,
      persist: true,
    });

    return jsonOk({
      framework: "access_as_infrastructure",
      productionClaim: "none",
      synthetic: true,
      compatibility: result,
    });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Compatibility evaluation failed", 500);
  }
}
