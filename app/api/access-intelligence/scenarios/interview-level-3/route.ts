import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import {
  advanceFlightSim,
  completeFlightReflection,
  completeFlightTeachBack,
  completeFlightTransfer,
  flightHint,
  getInterviewScenarioBrief,
  revealFlightEvidence,
  reviseFlightPlan,
  startInterviewFlightSim,
  submitFlightDecision,
  submitFlightPrediction,
} from "@/lib/access-intelligence/living/flight-simulator";
import { decisionStatusSchema } from "@/lib/access-intelligence/schemas";

export async function GET() {
  const userId = await resolveAccessIntelligenceUserId();
  if (userId instanceof Response) return userId;
  return Response.json(getInterviewScenarioBrief());
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start") }),
  z.object({
    action: z.literal("predict"),
    sessionId: z.string(),
    status: decisionStatusSchema,
    confidence: z.number().min(0).max(100),
  }),
  z.object({
    action: z.literal("reveal_evidence"),
    sessionId: z.string(),
    evidenceId: z.string(),
  }),
  z.object({
    action: z.literal("decide"),
    sessionId: z.string(),
    entranceId: z.string(),
    routeId: z.string(),
    blockers: z.array(z.string()).default([]),
    unknowns: z.array(z.string()).default([]),
    venueQuestion: z.string().optional(),
    contingency: z.string().optional(),
  }),
  z.object({
    action: z.literal("revise"),
    sessionId: z.string(),
    routeId: z.string(),
    status: decisionStatusSchema,
    confidence: z.number().min(0).max(100),
  }),
  z.object({ action: z.literal("hint"), sessionId: z.string() }),
  z.object({
    action: z.literal("teach_back"),
    sessionId: z.string(),
    text: z.string(),
  }),
  z.object({
    action: z.literal("reflect"),
    sessionId: z.string(),
    reflections: z.array(z.string()),
  }),
  z.object({
    action: z.literal("transfer"),
    sessionId: z.string(),
    answer: z.string(),
  }),
  z.object({
    action: z.literal("advance"),
    sessionId: z.string(),
    to: z.enum([
      "orientation",
      "prediction",
      "investigation",
      "decision",
      "consequence",
      "revision",
      "teach_back",
      "reflection",
      "transfer",
      "complete",
    ]),
  }),
]);

export async function POST(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const parsed = actionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "Invalid action", details: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;
    switch (data.action) {
      case "start":
        return Response.json({ session: startInterviewFlightSim(userId) });
      case "predict":
        return Response.json({
          session: submitFlightPrediction(data.sessionId, data.status, data.confidence),
        });
      case "reveal_evidence":
        return Response.json({
          session: revealFlightEvidence(data.sessionId, data.evidenceId),
        });
      case "decide":
        return Response.json({
          session: submitFlightDecision(data.sessionId, data),
        });
      case "revise":
        return Response.json({
          session: reviseFlightPlan(
            data.sessionId,
            data.routeId,
            data.status,
            data.confidence,
          ),
        });
      case "hint":
        return Response.json(flightHint(data.sessionId));
      case "teach_back":
        return Response.json({
          session: completeFlightTeachBack(data.sessionId, data.text),
        });
      case "reflect":
        return Response.json({
          session: completeFlightReflection(data.sessionId, data.reflections),
        });
      case "transfer":
        return Response.json(completeFlightTransfer(data.sessionId, data.answer));
      case "advance":
        return Response.json({ session: advanceFlightSim(data.sessionId, data.to) });
      default: {
        const _exhaustive: never = data;
        return Response.json({ error: "Unhandled", details: _exhaustive }, { status: 400 });
      }
    }
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Flight sim error" },
      { status: 400 },
    );
  }
}
