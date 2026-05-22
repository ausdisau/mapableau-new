import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ careRequestId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { careRequestId } = await params;

  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
    include: {
      assignedOrganisation: { select: { id: true, name: true } },
      shifts: { take: 10 },
    },
  });
  if (!request) return jsonError("Not found", 404);

  const canView =
    isAdminRole(user.primaryRole) ||
    request.participantId === user.id ||
    request.assignedOrganisationId !== null;

  if (!canView) return jsonError("Forbidden", 403);

  return jsonOk({
    request,
    accessNotice:
      "Care request details are visible to you, assigned providers, and MapAble admins.",
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ careRequestId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { careRequestId } = await params;
  const body = await req.json();

  const existing = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
  });
  if (!existing) return jsonError("Not found", 404);
  if (
    !isAdminRole(user.primaryRole) &&
    existing.participantId !== user.id
  ) {
    return jsonError("Forbidden", 403);
  }

  const request = await prisma.careRequest.update({
    where: { id: careRequestId },
    data: {
      title: body.title,
      description: body.description,
      status: isAdminRole(user.primaryRole) ? body.status : undefined,
    },
  });
  return jsonOk({ request });
}
