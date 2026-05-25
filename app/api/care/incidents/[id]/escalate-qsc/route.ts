import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { escalateIncidentToQualitySafeguards } from "@/lib/incidents/incident-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("incident:manage:any");
  if (user instanceof Response) return user;
  const { id } = await params;
  const incident = await escalateIncidentToQualitySafeguards(id, user.id);
  return jsonOk({ incident });
}
import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { assertProviderOrgAccess, isCareAccessError } from "@/lib/care/access-control";
import { escalateIncidentToQualitySafeguards } from "@/lib/incidents/incident-service";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;
  const { id } = await params;

  try {
    const incident = await prisma.incidentReport.findUnique({ where: { id } });
    if (!incident) return jsonError("Not found", 404);
    await assertProviderOrgAccess(user, incident.organisationId);
    const escalated = await escalateIncidentToQualitySafeguards(id, user.id);
    return jsonOk({ incident: escalated });
  } catch (error) {
    if (isCareAccessError(error)) return jsonError("Forbidden", 403);
    return jsonError("Escalation failed", 500);
  }
}
