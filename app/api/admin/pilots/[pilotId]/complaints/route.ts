import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  loadPilotScoped,
  mapPilotServiceError,
} from "@/lib/pilot/api/access";
import {
  linkComplaintToPilot,
  listPilotComplaints,
} from "@/lib/pilot/complaints/pilot-complaint-service";

const bodySchema = z.object({
  complaintId: z.string().cuid(),
});

type Params = { params: Promise<{ pilotId: string }> };

/** POST /api/admin/pilots/[pilotId]/complaints — link existing Complaint */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:complaint:manage");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const complaint = await linkComplaintToPilot({
      complaintId: parsed.data.complaintId,
      pilotId,
    });
    return jsonNdisOk({
      complaint: {
        id: complaint.id,
        pilotId: complaint.pilotId,
      },
    });
  } catch (e) {
    const mapped = mapPilotServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}

export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:complaint:manage");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const complaints = await listPilotComplaints(pilotId);
  return jsonNdisOk({
    pilotId,
    complaints: complaints.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      anonymous: c.anonymous,
      createdAt: c.createdAt.toISOString(),
    })),
  });
}
