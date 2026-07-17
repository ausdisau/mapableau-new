import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  loadPilotScoped,
  mapPilotServiceError,
} from "@/lib/pilot/api/access";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  note: z.string().max(2000).optional(),
});

type Params = { params: Promise<{ pilotId: string; triggerId: string }> };

/** POST /api/admin/pilots/[pilotId]/triggers/[triggerId]/acknowledge */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:incident:manage");
  if (user instanceof Response) return user;

  const { pilotId, triggerId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const existing = await prisma.pilotSafetyTrigger.findUnique({
      where: { id: triggerId },
    });
    if (!existing || existing.pilotId !== pilotId) {
      return jsonNdisError("Trigger not found", 404);
    }

    const trigger = await prisma.pilotSafetyTrigger.update({
      where: { id: triggerId },
      data: {
        status: "acknowledged",
        acknowledgedAt: new Date(),
        acknowledgedById: user.id,
      },
    });

    return jsonNdisOk({
      trigger: {
        id: trigger.id,
        status: trigger.status,
        acknowledgedAt: trigger.acknowledgedAt?.toISOString() ?? null,
        note: parsed.data.note ?? null,
      },
    });
  } catch (e) {
    const mapped = mapPilotServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
