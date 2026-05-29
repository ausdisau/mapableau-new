import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { isAdminRole } from "@/lib/auth/roles";
import { canManageProviderWorkers } from "@/lib/providers/can-manage-provider-workers";
import { prisma } from "@/lib/prisma";
import { affiliateWorkerToOrganisation } from "@/lib/workers/worker-profile-service";

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
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json();
  if (!body.organisationId || !body.userId || !body.displayName) {
    return jsonError("organisationId, userId, displayName required", 400);
  }

  const allowed = await canManageProviderWorkers(
    user.id,
    body.organisationId,
    user.primaryRole
  );
  if (!allowed) return jsonError("Forbidden", 403);

  const profile = await affiliateWorkerToOrganisation({
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
