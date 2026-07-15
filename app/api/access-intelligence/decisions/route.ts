import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { evaluateAccessDecision } from "@/lib/access-intelligence/decision-engine";
import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { getAccessIntelligenceRepository } from "@/lib/access-intelligence/repositories";

const bodySchema = z.object({
  placeId: z.string().min(1),
  passportId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "placeId and passportId are required.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    const repo = getAccessIntelligenceRepository();
    const passport = await repo.getPassport(userId, parsed.data.passportId);
    const graph = await repo.readAccessGraph(parsed.data.placeId);
    const incidents = await repo.getLiveIncidents(parsed.data.placeId);
    const decision = evaluateAccessDecision({
      place: graph.place,
      passport,
      features: graph.features,
      evidence: graph.evidence,
      incidents,
    });
    return Response.json({ decision });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json(
      { error: "Could not calculate decision.", code: "REPOSITORY_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
