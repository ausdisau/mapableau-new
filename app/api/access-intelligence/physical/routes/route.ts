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
          error: "Invalid route payload.",
          code: "VALIDATION_ERROR",
          recoveryHint: "Provide journey node ids or destination label.",
        },
        { status: 400 },
      );
    }
    const passport = resolvePhysicalPassport(userId, parsed.data.passportId);
    const plan = planPhysicalVisit(passport, parsed.data);
    return Response.json({
      placeId: plan.placeId,
      route: plan.route,
      fallbackRoute: plan.fallbackRoute,
      rejected: plan.rejectedRouteSummaries,
      instructions: plan.route?.steps.map((s) => s.instruction) ?? [],
      fictionalNotice: plan.fictionalNotice,
    });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}
