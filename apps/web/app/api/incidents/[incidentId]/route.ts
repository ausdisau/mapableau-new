import { requireApiSession, requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { acknowledgeCriticalIncident, submitIncident } from "@/lib/incidents/incident-service";
import { prisma } from "@/lib/prisma";
import { canUserAccessIncident } from "@/lib/safety/incident-access";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ incidentId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { incidentId } = await params;
  const incident = await prisma.incidentReport.findUnique({
    where: { id: incidentId },
    include: { updates: { orderBy: { createdAt: "asc" } } },
  });
  if (!incident) return jsonError("Not found", 404);
  if (
    !canUserAccessIncident(
      incident,
      user.id,
      isAdminRole(user.primaryRole)
    )
  ) {
    return jsonError("Forbidden", 403);
  }
  return jsonOk({ incident });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ incidentId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { incidentId } = await params;
  const body = await req.json();
  if (body.action === "submit") {
    const incident = await submitIncident(incidentId, user.id);
    return jsonOk({ incident });
  }
  if (body.action === "acknowledge") {
    const admin = await requireApiAdmin();
    if (admin instanceof Response) return admin;
    const incident = await acknowledgeCriticalIncident(incidentId, admin.id);
    return jsonOk({ incident });
  }
  const incident = await prisma.incidentReport.update({
    where: { id: incidentId },
    data: { status: body.status, title: body.title },
  });
  return jsonOk({ incident });
}
