import { requireApiPermission } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiPermission("tenant:entitlements:read");
  if (user instanceof Response) return user;
  const orgIds = await getUserOrganisationIds(user.id);
  const entitlements = await prisma.tenantFeatureEntitlement.findMany({
    where: { organisationId: { in: orgIds } },
    orderBy: [{ organisationId: "asc" }, { featureKey: "asc" }],
  });
  return jsonOk({
    entitlements,
    disclaimer:
      "Env flags do not enable a feature. All of: env flag, entitlement, assurance readiness, and (production) GA approval are required.",
  });
}
