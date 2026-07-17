import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  loadPilotScoped,
  mapPilotServiceError,
  toSafePilotSummary,
} from "@/lib/pilot/api/access";
import { assertCanTransitionPilotStatus } from "@/lib/pilot/policy/pilot-status";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  rationale: z.string().min(1).max(4000),
});

type Params = { params: Promise<{ pilotId: string }> };

/** POST /api/admin/pilots/[pilotId]/request-approval */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:create");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    assertCanTransitionPilotStatus(pilot.status, "pending_decision");
    const correlationId = createCorrelationId();
    const updated = await prisma.$transaction(async (tx) => {
      await tx.pilotDecisionRecord.create({
        data: {
          pilotId,
          decision: "defer",
          fromStatus: pilot.status,
          toStatus: "pending_decision",
          fromStage: pilot.stage,
          toStage: pilot.stage,
          rationale: parsed.data.rationale,
          decidedById: user.id,
          correlationId,
        },
      });
      return tx.controlledPilot.update({
        where: { id: pilotId },
        data: { status: "pending_decision", updatedById: user.id },
      });
    });
    return jsonNdisOk({ pilot: toSafePilotSummary(updated) });
  } catch (e) {
    const mapped = mapPilotServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
