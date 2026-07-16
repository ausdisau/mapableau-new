import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { getAccessIntelligenceRepository } from "@/lib/access-intelligence/repositories";
import {
  assertEligibleRoute,
  buildAccessibleRoute,
} from "@/lib/access-intelligence/routing";

const bodySchema = z.object({
  placeId: z.string().min(1),
  passportId: z.string().min(1),
  destination: z.string().min(1),
  fromNodeId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        {
          error: "placeId, passportId and destination are required.",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }
    const repo = getAccessIntelligenceRepository();
    const passport = await repo.getPassport(userId, parsed.data.passportId);
    const graph = await repo.readAccessGraph(parsed.data.placeId);
    const incidents = await repo.getLiveIncidents(parsed.data.placeId);
    const toNodeId = await repo.findDestinationNodeId(
      parsed.data.placeId,
      parsed.data.destination,
    );
    const fromNodeId =
      parsed.data.fromNodeId ??
      (await repo.findPreferredEntranceNodeId(parsed.data.placeId, {
        preferStepFree: passport.requirements.some(
          (r) => r.featureType === "step_free" && r.importance === "required",
        ),
      }));
    const result = buildAccessibleRoute({
      placeId: parsed.data.placeId,
      nodes: graph.nodes,
      edges: graph.edges,
      passport,
      fromNodeId,
      toNodeId,
      incidents,
    });
    if (!result.recommended) {
      return Response.json(
        {
          recommended: null,
          fallback: null,
          rejected: result.rejected,
          error: "No route satisfies the required access constraints.",
          code: "NO_ELIGIBLE_ROUTE",
          recoveryHint:
            "Review blockers, ask the venue to verify missing features, or adjust your passport.",
        },
        { status: 200 },
      );
    }
    const recommended = assertEligibleRoute(result);
    return Response.json({
      recommended,
      fallback: result.fallback,
      rejected: result.rejected,
      textualInstructions: recommended.steps.map((s) => s.instruction),
    });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json(
      { error: "Could not build route.", code: "REPOSITORY_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
