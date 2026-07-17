import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  loadPilotScoped,
  mapPilotServiceError,
} from "@/lib/pilot/api/access";
import {
  linkIncidentToPilot,
  listPilotIncidents,
} from "@/lib/pilot/incidents/pilot-incident-service";

const bodySchema = z.object({
  incidentId: z.string().cuid(),
});

type Params = { params: Promise<{ pilotId: string }> };

/** POST /api/admin/pilots/[pilotId]/incidents — link existing IncidentReport */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:incident:manage");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const incident = await linkIncidentToPilot({
      incidentId: parsed.data.incidentId,
      pilotId,
    });
    return jsonNdisOk({
      incident: {
        id: incident.id,
        pilotId: incident.pilotId,
        reportabilityState: incident.reportabilityState,
      },
    });
  } catch (e) {
    const mapped = mapPilotServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}

/** GET list for admin UI convenience */
export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:incident:manage");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const incidents = await listPilotIncidents(pilotId);
  return jsonNdisOk({
    pilotId,
    incidents: incidents.map((i) => ({
      id: i.id,
      reportabilityState: i.reportabilityState,
      createdAt: i.createdAt.toISOString(),
    })),
  });
}
