import { ZodError, z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  resolveDefaultTenantForUser,
  resolveTenantContext,
} from "@/lib/tenancy/context/tenant-resolver";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const defaultOrgId = await resolveDefaultTenantForUser(user);
  const ctx = await resolveTenantContext(user, {
    requestedOrganisationId: defaultOrgId,
  });
  return jsonOk({
    activeOrganisationId: ctx.organisationId,
    disclaimer:
      "Active tenant is chosen by the caller. Platform admins have no ambient tenant scope.",
  });
}

const putSchema = z.object({
  organisationId: z.string().min(1),
});

export async function PUT(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  try {
    const { organisationId } = putSchema.parse(await req.json());
    if (user.primaryRole !== "mapable_admin") {
      const orgIds = await getUserOrganisationIds(user.id);
      if (!orgIds.includes(organisationId)) {
        return jsonError("NOT_A_MEMBER", 403);
      }
    }
    return jsonOk({ activeOrganisationId: organisationId });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Invalid request", 400);
  }
}
