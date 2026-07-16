import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { evaluateAccessDecision } from "@/lib/access-intelligence/decision-engine";
import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { getAccessIntelligenceRepository } from "@/lib/access-intelligence/repositories";
import { buildAccessibleRoute } from "@/lib/access-intelligence/routing";

const createSchema = z.object({
  placeId: z.string().min(1),
  passportId: z.string().min(1),
  destination: z.string().min(1),
  visitAt: z.string().optional(),
});

export async function GET() {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const plans = await getAccessIntelligenceRepository().listVisitPlans(userId);
    return Response.json({ plans });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json(
      { error: "Could not load visit plans.", code: "REPOSITORY_UNAVAILABLE" },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid visit plan payload.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    const repo = getAccessIntelligenceRepository();
    const passport = await repo.getPassport(userId, parsed.data.passportId);
    const graph = await repo.readAccessGraph(parsed.data.placeId);
    const incidents = await repo.getLiveIncidents(parsed.data.placeId);
    const explained = evaluateAccessDecision({
      place: graph.place,
      passport,
      features: graph.features,
      evidence: graph.evidence,
      incidents,
    });
    const { findings, explanationSummary: _summary, ...decision } = explained;
    let route = null;
    try {
      const toNodeId = await repo.findDestinationNodeId(
        parsed.data.placeId,
        parsed.data.destination,
      );
      const fromNodeId = await repo.findPreferredEntranceNodeId(parsed.data.placeId, {
        preferStepFree: true,
      });
      const built = buildAccessibleRoute({
        placeId: parsed.data.placeId,
        nodes: graph.nodes,
        edges: graph.edges,
        passport,
        fromNodeId,
        toNodeId,
        incidents,
      });
      route = built.recommended;
      if (route) decision.recommendedRouteId = route.id;
    } catch {
      // keep plan without route
    }
    const plan = await repo.saveVisitPlan({
      id: `visit-${Date.now()}`,
      userId,
      placeId: parsed.data.placeId,
      destination: parsed.data.destination,
      visitAt: parsed.data.visitAt,
      accessDecision: decision,
      route,
      arrivalInstructions:
        route?.steps.map((s) => s.instruction) ??
        ["No eligible route was available."],
      contingencyInstructions: [
        "This is not an approved emergency evacuation route.",
        "Re-check live conditions before travelling.",
      ],
      evidenceSummary: findings.matchedPreferences.map((f) => f.message),
      lastCheckedAt: new Date().toISOString(),
    });
    return Response.json({ plan, explanation: explained.explanationSummary });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json(
      { error: "Could not create visit plan.", code: "REPOSITORY_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
