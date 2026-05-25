import { requireApiSession, requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireStepUp } from "@/lib/access/require-step-up";
import { logSensitiveRead } from "@/lib/access/log-sensitive-read";
import { acknowledgeCriticalIncident, submitIncident } from "@/lib/incidents/incident-service";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ incidentId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const stepUp = await requireStepUp(user, "incident.view");
  if (stepUp) return stepUp;
  const { incidentId } = await params;
  const incident = await prisma.incidentReport.findUnique({
    where: { id: incidentId },
    include: { updates: { orderBy: { createdAt: "asc" } } },
  });
  if (!incident) return jsonError("Not found", 404);

  await logSensitiveRead({
    actorUserId: user.id,
    subjectUserId: incident.participantId ?? undefined,
    resourceType: "IncidentReport",
    resourceId: incidentId,
    classification: "sensitive_information",
    purpose: "incident_record_view",
  });

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
