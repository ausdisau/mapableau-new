import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { canManageWorkersInOrganisation } from "@/lib/workers/worker-org-access";
import { createWorkerProfile } from "@/lib/workers/worker-profile-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const orgIds = isAdminRole(user.primaryRole)
    ? undefined
    : await getUserOrganisationIds(user.id);

  const workers = await prisma.workerProfile.findMany({
    where: orgIds ? { organisationId: { in: orgIds } } : undefined,
    take: 100,
    orderBy: { createdAt: "desc" },
  });
  return jsonOk({ workers });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("worker:manage:org");
  if (user instanceof Response) return user;
  const body = await req.json();
  if (!body.organisationId || !body.userId || !body.displayName) {
    return jsonError("organisationId, userId, displayName required", 400);
  }

  if (
    !(await canManageWorkersInOrganisation(
      user.id,
      body.organisationId,
      user.primaryRole
    ))
  ) {
    return jsonError("Forbidden", 403);
  }

  const targetMembership = await prisma.organisationMember.findFirst({
    where: {
      userId: body.userId,
      organisationId: body.organisationId,
    },
  });
  if (!targetMembership) {
    return jsonError(
      "User must be a member of the organisation before creating a worker profile",
      400
    );
  }

  const profile = await createWorkerProfile({
    organisationId: body.organisationId,
    userId: body.userId,
    displayName: body.displayName,
    profileSummary: body.profileSummary,
    serviceTypes: body.serviceTypes,
    serviceRegions: body.serviceRegions,
    createdById: user.id,
  });
  return jsonOk({ profile }, 201);
}
