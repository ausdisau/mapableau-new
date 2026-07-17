import { requireApiPermission, requireApiSession } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { createDriverProfile } from "@/lib/transport/driver-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const where = isAdminRole(user.primaryRole)
    ? { organisationId: "__platform_unscoped_denied__" }
    : { organisationId: { in: await getUserOrganisationIds(user.id) } };

  const drivers = await prisma.driverProfile.findMany({ where, take: 100 });
  return jsonOk({ drivers });
}

export async function POST(req: Request) {
  const user = await requireApiPermission("driver:manage:org");
  if (user instanceof Response) return user;
  const body = await req.json();
  const driver = await createDriverProfile({
    userId: body.userId,
    organisationId: body.organisationId,
    displayName: body.displayName,
    phone: body.phone,
    serviceRegions: body.serviceRegions,
    actorUserId: user.id,
  });
  return jsonOk({ driver }, 201);
}
