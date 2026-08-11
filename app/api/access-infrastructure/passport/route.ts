import { ZodError } from "zod";
import { accessInfrastructurePassportPatchSchema } from "@mapable/contracts";

import { requireApiSession } from "@/lib/api/auth-handler";
import { isResponse, jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  accessInfrastructureFlags,
  getOrCreateAccessPassport,
  patchAccessPassport,
  toPassportApiResponse,
} from "@/lib/access/infrastructure";

export const dynamic = "force-dynamic";

function flagDisabled() {
  return jsonError("Access Passport is disabled", 404);
}

/**
 * GET participant-owned Access Passport (owner-only).
 * Never expose on public place/list endpoints.
 */
export async function GET() {
  if (!accessInfrastructureFlags.passport) return flagDisabled();

  const user = await requireApiSession();
  if (isResponse(user)) return user;

  const passport = await getOrCreateAccessPassport(user.id);
  return jsonOk({
    framework: "access_as_infrastructure",
    productionClaim: "none",
    passport: toPassportApiResponse(passport),
  });
}

/**
 * PATCH Access Passport requirements / visibility (owner-only).
 */
export async function PATCH(req: Request) {
  if (!accessInfrastructureFlags.passport) return flagDisabled();

  const user = await requireApiSession();
  if (isResponse(user)) return user;

  try {
    const body = accessInfrastructurePassportPatchSchema.parse(await req.json());
    const passport = await patchAccessPassport({
      userId: user.id,
      actorRole: user.primaryRole,
      patch: {
        visibilityDefault: body.visibilityDefault,
        requirements: body.requirements?.map((r) => ({
          id: r.id,
          ontologyConceptId: r.ontologyConceptId,
          domain: r.domain,
          attribute: r.attribute,
          comparator: r.comparator,
          value: r.value,
          unit: r.unit,
          criticality: r.criticality,
          contextScope: r.contextScope,
          timing: r.timing,
          assistance: r.assistance,
          disclosureScopes: r.disclosureScopes,
          userConfirmed: r.userConfirmed,
          acceptableAdjustmentIds: r.acceptableAdjustmentIds,
          notes: r.notes,
          _delete: r._delete,
        })),
      },
    });
    return jsonOk({
      framework: "access_as_infrastructure",
      productionClaim: "none",
      passport: toPassportApiResponse(passport),
    });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Update failed", 500);
  }
}
