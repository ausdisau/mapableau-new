import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import {
  advanceFlightSim,
  completeFlightReflection,
  completeFlightTeachBack,
  completeFlightTransfer,
  flightHint,
  getFlightSim,
  getInterviewScenarioBrief,
  revealFlightEvidence,
  reviseFlightPlan,
  startInterviewFlightSim,
  submitFlightDecision,
  submitFlightPrediction,
  type FlightSimSession,
} from "@/lib/access-intelligence/living/flight-simulator";
import { persistFlightSimSession } from "@/lib/access-intelligence/living/persist-flight";
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

async function withPersistedSession(
  session: FlightSimSession,
  body: Record<string, unknown> = {},
) {
  const persisted = await persistFlightSimSession(session);
  return Response.json({
    session,
    ...body,
    persistence: persisted ? "saved" : "ephemeral",
  });
}

export async function POST(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const parsed = actionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid action", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = parsed.data;
    switch (data.action) {
      case "start":
        return withPersistedSession(startInterviewFlightSim(userId));
      case "predict":
        return withPersistedSession(
          submitFlightPrediction(data.sessionId, data.status, data.confidence),
        );
      case "reveal_evidence":
        return withPersistedSession(
          revealFlightEvidence(data.sessionId, data.evidenceId),
        );
      case "decide":
        return withPersistedSession(submitFlightDecision(data.sessionId, data));
      case "revise":
        return withPersistedSession(
          reviseFlightPlan(
            data.sessionId,
            data.routeId,
            data.status,
            data.confidence,
          ),
        );
      case "hint": {
        const result = flightHint(data.sessionId);
        await persistFlightSimSession(getFlightSim(data.sessionId));
        return Response.json(result);
      }
      case "teach_back":
        return withPersistedSession(
          completeFlightTeachBack(data.sessionId, data.text),
        );
      case "reflect":
        return withPersistedSession(
          completeFlightReflection(data.sessionId, data.reflections),
        );
      case "transfer": {
        const result = completeFlightTransfer(data.sessionId, data.answer);
        if (result.session) {
          await persistFlightSimSession(result.session);
        }
        return Response.json({ ...result, persistence: "saved" });
      }
      case "advance":
        return withPersistedSession(advanceFlightSim(data.sessionId, data.to));
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
