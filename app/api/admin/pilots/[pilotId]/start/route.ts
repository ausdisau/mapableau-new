import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  loadPilotScoped,
  mapPilotServiceError,
  toSafePilotSummary,
} from "@/lib/pilot/api/access";
import { assertCanTransitionPilotStatus } from "@/lib/pilot/policy/pilot-status";
import {
  isLimitedLivePermitted,
  requiresAssuranceForStage,
} from "@/lib/pilot/policy/stage-policy";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  rationale: z.string().min(1).max(4000),
});

type Params = { params: Promise<{ pilotId: string }> };

/** POST /api/admin/pilots/[pilotId]/start — approved -> active */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:start");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    if (pilot.status !== "approved") {
      return jsonNdisError(
        `Pilot must be approved before start (current: ${pilot.status})`,
        400
      );
    }
    assertCanTransitionPilotStatus(pilot.status, "active");

    if (requiresAssuranceForStage(pilot.stage)) {
      const live = isLimitedLivePermitted({
        stage: pilot.stage,
        limitedLiveEnabled: pilot.limitedLiveEnabled,
        assuranceAssessmentId: pilot.assuranceAssessmentId,
        goLiveAssessmentId: pilot.goLiveAssessmentId,
      });
      if (!live.ok) {
        return jsonNdisError(
          `Cannot start at ${pilot.stage}: ${live.reasons.join(", ")}`,
          400
        );
      }
    }

    const correlationId = createCorrelationId();
    const updated = await prisma.$transaction(async (tx) => {
      await tx.pilotDecisionRecord.create({
        data: {
          pilotId,
          decision: "advance_stage",
          fromStatus: pilot.status,
          toStatus: "active",
          fromStage: pilot.stage,
          toStage: pilot.stage,
          rationale: parsed.data.rationale,
          decidedById: user.id,
          correlationId,
        },
      });
      return tx.controlledPilot.update({
        where: { id: pilotId },
        data: {
          status: "active",
          activatedAt: pilot.activatedAt ?? new Date(),
          updatedById: user.id,
        },
      });
    });

    return jsonNdisOk({ pilot: toSafePilotSummary(updated) });
  } catch (e) {
    const mapped = mapPilotServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
