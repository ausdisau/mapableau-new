import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createIncident, submitIncident } from "@/lib/incidents/incident-service";
import { careIncidentSchema } from "@/lib/validation/care";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const user = await requireApiPermission("incident:create");
  if (user instanceof Response) return user;
  const parsed = careIncidentSchema.safeParse(await req.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const shift = parsed.data.shiftId
    ? await prisma.careShift.findFirst({
        where: { id: parsed.data.shiftId, workerProfile: { userId: user.id } },
      })
    : null;
  if (parsed.data.shiftId && !shift) return jsonError("Shift not found", 404);

  const incident = await createIncident({
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category as never,
    severity: parsed.data.severity as never,
    reportedById: user.id,
    participantId: shift?.participantId,
    careShiftId: shift?.id,
    organisationId: shift?.organisationId,
    immediateRiskPresent: parsed.data.immediateRiskPresent,
    safeguardingConcern: parsed.data.safeguardingConcern,
  });
  const submitted = await submitIncident(incident.id, user.id);
  return jsonOk({ incident: submitted }, 201);
}
import { ZodError } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createIncident, submitIncident } from "@/lib/incidents/incident-service";
import { prisma } from "@/lib/prisma";
import { careIncidentSchema } from "@/lib/validation/care";

export async function POST(req: Request) {
  const user = await requireApiPermission("incident:create");
  if (user instanceof Response) return user;

  try {
    const parsed = careIncidentSchema.parse(await req.json());
    const shift = parsed.careShiftId
      ? await prisma.careShift.findUnique({
          where: { id: parsed.careShiftId },
          include: { workerProfile: true },
        })
      : null;
    if (shift && shift.workerProfile?.userId !== user.id) {
      return jsonError("Forbidden", 403);
    }

    const incident = await createIncident({
      ...parsed,
      participantId: parsed.participantId ?? shift?.participantId,
      organisationId: parsed.organisationId ?? shift?.organisationId,
      reportedById: user.id,
    });
    const submitted = await submitIncident(incident.id, user.id);
    return jsonOk({ incident: submitted }, 201);
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    if (error instanceof Error && error.message === "INCIDENTS_DISABLED") {
      return jsonError("Incident reporting is disabled.", 403);
    }
    return jsonError("Incident report failed", 500);
  }
}
