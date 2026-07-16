import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import {
  physicalErrorResponse,
  resolvePhysicalPassport,
} from "@/lib/access-intelligence/physical/api-helpers";
import { planPhysicalVisit } from "@/lib/access-intelligence/physical/services/plan-visit";

const bodySchema = z.object({
  passportId: z.string().optional(),
  fromNodeId: z.string().optional(),
  toNodeId: z.string().optional(),
  destinationLabel: z.string().optional(),
  visitAt: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid decision payload.",
          code: "VALIDATION_ERROR",
          recoveryHint: "Provide a valid passportId and optional journey fields.",
        },
        { status: 400 },
      );
    }
    const passport = resolvePhysicalPassport(userId, parsed.data.passportId);
    const plan = planPhysicalVisit(passport, {
      fromNodeId: parsed.data.fromNodeId,
      toNodeId: parsed.data.toNodeId,
      destinationLabel: parsed.data.destinationLabel,
      visitAt: parsed.data.visitAt,
    });
    return Response.json({
      passportId: passport.id,
      decision: plan.decision,
      route: plan.route,
      fallbackRoute: plan.fallbackRoute,
      rejectedRouteSummaries: plan.rejectedRouteSummaries,
      availableCapabilities: plan.availableCapabilities,
      devices: plan.devices,
      emergency: plan.emergency,
      mode: plan.mode,
      fictionalNotice: plan.fictionalNotice,
      generatedAt: plan.generatedAt,
    });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}
