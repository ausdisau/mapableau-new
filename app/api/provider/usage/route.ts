import { requireApiPermission } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiPermission("tenant:quotas:read");
  if (user instanceof Response) return user;
  const orgIds = await getUserOrganisationIds(user.id);
  const usage = await prisma.tenantOperationalHealth.findMany({
    where: { organisationId: { in: orgIds } },
    orderBy: { windowEnd: "desc" },
    take: 60,
  });
  return jsonOk({ usage });
}
