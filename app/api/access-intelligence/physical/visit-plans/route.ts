import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { HARBOUR_PLACE_ID } from "@/lib/access-intelligence/living/harbour-civic";
import {
  physicalErrorResponse,
  resolvePhysicalPassport,
} from "@/lib/access-intelligence/physical/api-helpers";
import { planPhysicalVisit } from "@/lib/access-intelligence/physical/services/plan-visit";
import {
  listPhysicalVisitPlans,
  savePhysicalVisitPlan,
} from "@/lib/access-intelligence/physical/visit-store";

const createSchema = z.object({
  passportId: z.string().optional(),
  destinationLabel: z.string().default("Interview Room 3.12"),
  fromNodeId: z.string().optional(),
  toNodeId: z.string().optional(),
  visitAt: z.string().optional(),
});

export async function GET() {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    return Response.json({ plans: listPhysicalVisitPlans(userId) });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid visit plan payload.",
          code: "VALIDATION_ERROR",
          recoveryHint: "Provide destinationLabel and optional passportId.",
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
    const stored = savePhysicalVisitPlan({
      id: `phys-visit-${Date.now()}`,
      userId,
      passportId: passport.id,
      placeId: HARBOUR_PLACE_ID,
      destinationLabel: parsed.data.destinationLabel,
      visitAt: parsed.data.visitAt,
      createdAt: new Date().toISOString(),
      plan,
    });
    return Response.json({ plan: stored });
  } catch (error) {
    return physicalErrorResponse(error);
  }
}
