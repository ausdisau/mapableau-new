import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  loadPilotScoped,
  mapPilotServiceError,
} from "@/lib/pilot/api/access";
import { approvePilotChangeRequest } from "@/lib/pilot/change/change-request-service";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  note: z.string().max(2000).optional(),
});

type Params = { params: Promise<{ pilotId: string; changeId: string }> };

/** POST /api/admin/pilots/[pilotId]/changes/[changeId]/approve */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:change:approve");
  if (user instanceof Response) return user;

  const { pilotId, changeId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const existing = await prisma.pilotChangeRequest.findUnique({
      where: { id: changeId },
    });
    if (!existing || existing.pilotId !== pilotId) {
      return jsonNdisError("Change request not found", 404);
    }

    const change = await approvePilotChangeRequest({
      changeRequestId: changeId,
      approvedById: user.id,
    });
    return jsonNdisOk({
      change: {
        id: change.id,
        status: change.status,
        approvedAt: change.approvedAt?.toISOString() ?? null,
        note: parsed.data.note ?? null,
      },
      notice: "Pilot change approval is not production approval.",
    });
  } catch (e) {
    const mapped = mapPilotServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
