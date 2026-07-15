import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { createDemoPassports } from "@/lib/access-intelligence/demo-data";
import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import {
  buildHarbourLivingTwin,
  buildPersonalAccessTwin,
  defaultInterviewTwin,
  evaluateDecisionForTwin,
  getAccessStateAt,
} from "@/lib/access-intelligence/living";

export async function GET(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const url = new URL(request.url);
    const visitAt = url.searchParams.get("visitAt") ?? "2026-07-16T00:00:00.000Z";
    const twin = buildHarbourLivingTwin();
    const state = getAccessStateAt(twin, visitAt);
    return Response.json({
      twin: {
        place: twin.place,
        version: twin.version,
        fictionalNotice: twin.fictionalNotice,
        destinations: twin.destinations,
        elementCount: twin.elements.length,
        evidenceCount: twin.evidence.length,
        operatingRules: twin.operatingRules,
      },
      state,
    });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json({ error: "Could not load Living Twin." }, { status: 503 });
  }
}

const visitBodySchema = z.object({
  passportId: z.string().optional(),
  destination: z.string().default("Interview Room 3.12"),
  visitAt: z.string().default("2026-07-16T00:00:00.000Z"),
  purpose: z.string().default("Visit planning"),
});

export async function POST(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const parsed = visitBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "Invalid body", code: "VALIDATION_ERROR" }, { status: 400 });
    }
    const passports = createDemoPassports(userId);
    const passport =
      passports.find((p) => p.id === parsed.data.passportId) ??
      passports.find((p) => p.id === "passport-power-chair") ??
      defaultInterviewTwin(userId).passport;
    const personal = buildPersonalAccessTwin({
      passport,
      journeyContext: {
        purpose: parsed.data.purpose,
        destination: parsed.data.destination,
        visitAt: parsed.data.visitAt,
        currentMobilityAid: passport.mobilityAids[0],
        optimisationGoal: "highest_confidence",
        uncertaintyTolerance: "low",
      },
    });
    const twin = buildHarbourLivingTwin();
    const result = evaluateDecisionForTwin({
      twin,
      personalTwin: personal,
      visitAt: parsed.data.visitAt,
    });
    return Response.json({
      personalTwin: personal,
      ...result,
      fourMeasures: {
        venueAccessBaseline: result.decision.baselineScore,
        personalAccessFit: result.decision.personalFit,
        evidenceConfidence: result.decision.evidenceConfidence,
        liveReliability: result.decision.liveReliability,
      },
    });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json({ error: "Visit evaluation failed." }, { status: 503 });
  }
}
