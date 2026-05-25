import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("care:read:self");
  if (user instanceof Response) return user;
  const { id } = await params;
  const serviceLog = await prisma.careServiceLog.findUnique({
    where: { id },
    include: { shift: { include: { workerProfile: true } } },
  });
  if (!serviceLog) return jsonError("Not found", 404);
  const allowed =
    serviceLog.participantId === user.id ||
    serviceLog.shift?.workerProfile?.userId === user.id ||
    user.primaryRole === "mapable_admin";
  if (!allowed) return jsonError("Forbidden", 403);
  return jsonOk({ serviceLog });
}
import { requireApiSession } from "@/lib/api/auth-handler";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id } = await params;

  const serviceLog = await prisma.careServiceLog.findUnique({
    where: { id },
    include: { booking: true, workerProfile: true, shift: true },
  });
  if (!serviceLog) return jsonError("Not found", 404);

  const canView =
    isAdminRole(user.primaryRole) ||
    serviceLog.participantId === user.id ||
    serviceLog.workerProfile?.userId === user.id ||
    (user.primaryRole === "provider_admin" &&
      (await getUserOrganisationIds(user.id)).includes(serviceLog.organisationId));

  if (!canView) return jsonError("Forbidden", 403);
  return jsonOk({ serviceLog });
}
