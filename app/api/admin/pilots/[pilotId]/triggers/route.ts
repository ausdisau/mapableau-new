import type { Prisma } from "@prisma/client";
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
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  conditionJson: z.record(z.string(), z.unknown()).optional(),
});

type Params = { params: Promise<{ pilotId: string }> };

/** POST /api/admin/pilots/[pilotId]/triggers */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:incident:manage");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const trigger = await prisma.pilotSafetyTrigger.create({
      data: {
        pilotId,
        name: parsed.data.name,
        description: parsed.data.description,
        conditionJson: (parsed.data.conditionJson ??
          {}) as Prisma.InputJsonValue,
        status: "armed",
      },
    });
    return jsonNdisOk(
      {
        trigger: {
          id: trigger.id,
          name: trigger.name,
          status: trigger.status,
        },
      },
      201
    );
  } catch (e) {
    const mapped = mapPilotServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
