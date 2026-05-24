import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { userCanAccessOrganisation } from "@/lib/api/verification-scope";
import { isAdminRole } from "@/lib/auth/roles";
import { normalizeAbnDigits } from "@/lib/abn-lookup/format-abn";
import { validateAbnChecksum } from "@/lib/abn-lookup/validate-abn";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { abnLookupBodySchema } from "@/lib/validation/verification";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ organisationId: string }> }
) {
  let user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!isAdminRole(user.primaryRole)) {
    const permitted = await requireApiPermission("verification:manage:org");
    if (permitted instanceof Response) return permitted;
    user = permitted;
  }

  const { organisationId } = await params;
  if (!(await userCanAccessOrganisation(user, organisationId))) {
    return jsonError("Forbidden", 403);
  }

  const body = await req.json();
  const parsed = abnLookupBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, 400);
  }

  const validated = validateAbnChecksum(parsed.data.abn);
  if (!validated.valid) {
    return jsonError(validated.reason, 400);
  }

  const org = await prisma.organisation.update({
    where: { id: organisationId },
    data: { abn: validated.digits },
  });

  await createAuditEvent({
    actorUserId: user.id,
    action: "organisation.abn_updated",
    entityType: "Organisation",
    entityId: organisationId,
    organisationId,
    metadata: { abn: validated.digits },
  });

  return jsonOk({ organisation: org });
}
