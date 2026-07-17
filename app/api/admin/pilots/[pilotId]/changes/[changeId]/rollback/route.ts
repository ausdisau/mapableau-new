import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  loadPilotScoped,
  mapPilotServiceError,
} from "@/lib/pilot/api/access";
import { rollbackPilotChange } from "@/lib/pilot/change/rollback-service";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  reason: z.string().min(1).max(4000),
});

type Params = { params: Promise<{ pilotId: string; changeId: string }> };

/** POST /api/admin/pilots/[pilotId]/changes/[changeId]/rollback */
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

    const change = await rollbackPilotChange({
      changeRequestId: changeId,
      actorUserId: user.id,
      reason: parsed.data.reason,
    });
    return jsonNdisOk({
      change: {
        id: change.id,
        status: change.status,
        rolledBackAt: change.rolledBackAt?.toISOString() ?? null,
      },
    });
  } catch (e) {
    const mapped = mapPilotServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
