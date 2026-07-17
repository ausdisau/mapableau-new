import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  loadPilotScoped,
  mapPilotServiceError,
  toSafePilotSummary,
} from "@/lib/pilot/api/access";
import { recordPilotDecision } from "@/lib/pilot/progression/pilot-decision-service";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  rationale: z.string().min(1).max(4000),
});

type Params = { params: Promise<{ pilotId: string }> };

/** POST /api/admin/pilots/[pilotId]/terminate */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:terminate");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await recordPilotDecision({
      pilotId,
      decision: "terminate",
      decidedById: user.id,
      rationale: parsed.data.rationale,
    });
    const updated = await prisma.controlledPilot.findUniqueOrThrow({
      where: { id: pilotId },
    });
    return jsonNdisOk({ pilot: toSafePilotSummary(updated) });
  } catch (e) {
    const mapped = mapPilotServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
