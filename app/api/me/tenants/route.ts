import { requireApiSession } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { projectTenant } from "@/lib/tenancy/context/tenant-projection";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const orgIds = await getUserOrganisationIds(user.id);
  if (orgIds.length === 0) {
    return jsonOk({
      tenants: [],
      disclaimer:
        "You are not a member of any organisation. Ambient platform admin access is not granted by Wave 8.",
    });
  }
  const orgs = await prisma.organisation.findMany({
    where: { id: { in: orgIds } },
    select: {
      id: true,
      tenantKey: true,
      legalName: true,
      name: true,
      tenantType: true,
      operatingModel: true,
      tenantStatus: true,
      jurisdiction: true,
      dataRegion: true,
      dataIsolationMode: true,
    },
  });
  return jsonOk({
    tenants: orgs.map((o) =>
      projectTenant({ ...o, legalName: o.legalName ?? o.name })
    ),
  });
}
