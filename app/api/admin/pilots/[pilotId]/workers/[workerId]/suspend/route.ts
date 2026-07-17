import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  loadPilotScoped,
  mapPilotServiceError,
} from "@/lib/pilot/api/access";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  reason: z.string().min(1).max(2000),
});

type Params = { params: Promise<{ pilotId: string; workerId: string }> };

/** POST /api/admin/pilots/[pilotId]/workers/[workerId]/suspend */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:worker:authorise");
  if (user instanceof Response) return user;

  const { pilotId, workerId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const auth = await prisma.pilotWorkerAuthorisation.update({
      where: {
        pilotId_workerUserId: { pilotId, workerUserId: workerId },
      },
      data: {
        active: false,
        revokedAt: new Date(),
        revokedById: user.id,
        revokeReason: parsed.data.reason,
      },
    });
    return jsonNdisOk({
      authorisation: {
        id: auth.id,
        workerUserId: auth.workerUserId,
        active: auth.active,
        revokeReason: auth.revokeReason,
      },
    });
  } catch (e) {
    const mapped = mapPilotServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
