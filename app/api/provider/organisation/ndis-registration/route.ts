import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import {
  getProviderNdisRegistration,
  submitProviderNdisRegistration,
} from "@/lib/provider/ndis-registration-service";

const updateSchema = z.object({
  organisationId: z.string().cuid(),
  ndisRegistrationClaimed: z.boolean(),
  ndisRegistrationNumber: z.string().max(30),
});

export async function GET(req: Request) {
  const user = await requireApiPermission("worker:manage:org");
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  let organisationId = url.searchParams.get("organisationId");
  if (!organisationId) {
    const orgIds = await getUserOrganisationIds(user.id);
    organisationId = orgIds[0] ?? null;
  }
  if (!organisationId) {
    return jsonError("organisationId required", 400);
  }

  try {
    const org = await getProviderNdisRegistration(user, organisationId);
    return jsonOk({ organisation: org });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "NOT_FOUND") return jsonError("Not found", 404);
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    throw e;
  }
}

export async function PATCH(req: Request) {
  const user = await requireApiPermission("worker:manage:org");
  if (user instanceof Response) return user;

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (!isAdminRole(user.primaryRole)) {
    const orgIds = await getUserOrganisationIds(user.id);
    if (!orgIds.includes(parsed.data.organisationId)) {
      return jsonError("Forbidden", 403);
    }
  }

  try {
    const org = await submitProviderNdisRegistration({
      user,
      organisationId: parsed.data.organisationId,
      ndisRegistrationClaimed: parsed.data.ndisRegistrationClaimed,
      ndisRegistrationNumber: parsed.data.ndisRegistrationNumber,
    });
    return jsonOk({ organisation: org });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg === "INVALID_NDIS_REGISTRATION_NUMBER") {
      return jsonError("NDIS registration number must be 9–10 digits", 400);
    }
    if (msg === "FORBIDDEN") return jsonError("Forbidden", 403);
    throw e;
  }
}
