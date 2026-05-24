import {
  requireApiPermission,
  requireApiSession,
} from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import {
  createVerificationCase,
  submitVerificationCase,
} from "@/lib/provider-verification/verification-case-service";
import { runAbnCheckForCase } from "@/lib/provider-verification/abn-check-service";
import { userCanAccessOrganisation } from "@/lib/api/verification-scope";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const where = isAdminRole(user.primaryRole)
    ? {}
    : { organisationId: { in: await getUserOrganisationIds(user.id) } };

  const cases = await prisma.providerVerificationCase.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      checks: { where: { checkType: "abn" } },
      organisation: { select: { id: true, name: true, abn: true } },
    },
  });
  return jsonOk({ cases });
}

export async function POST(req: Request) {
  let user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!isAdminRole(user.primaryRole)) {
    const permitted = await requireApiPermission("verification:manage:org");
    if (permitted instanceof Response) return permitted;
    user = permitted;
  }

  const body = await req.json();
  const organisationId = body.organisationId as string | undefined;
  if (!organisationId) {
    return jsonError("organisationId required", 400);
  }

  if (!(await userCanAccessOrganisation(user, organisationId))) {
    return jsonError("Forbidden", 403);
  }

  try {
    const c = await createVerificationCase(organisationId, user.id);
    if (body.runAbnCheck) {
      await runAbnCheckForCase(c.id, user.id);
    }
    if (body.submit) {
      const submitted = await submitVerificationCase(c.id, user.id);
      return jsonOk({ case: submitted }, 201);
    }
    return jsonOk({ case: c }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "VERIFICATION_DISABLED") {
      return jsonError("Provider verification is disabled", 503);
    }
    throw e;
  }
}
