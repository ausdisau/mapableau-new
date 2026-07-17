import { requireApiPermission } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiPermission("tenant:policies:read");
  if (user instanceof Response) return user;
  const orgIds = await getUserOrganisationIds(user.id);
  const policies = await prisma.tenantPolicyProfile.findMany({
    where: { organisationId: { in: orgIds } },
    orderBy: [{ profileKey: "asc" }, { version: "desc" }],
  });
  return jsonOk({ policies });
}
