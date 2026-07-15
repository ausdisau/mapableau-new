import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { getLearningRepository } from "@/lib/access-intelligence/learning/repository";
import { learningModeSchema } from "@/lib/access-intelligence/learning/schemas";

const startSchema = z.object({
  scenarioId: z.string().min(1),
  mode: learningModeSchema.optional(),
});

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("predict"),
    sessionId: z.string(),
    optionId: z.string(),
    confidencePrediction: z.number().min(0).max(100).optional(),
  }),
  z.object({
    action: z.literal("reveal_evidence"),
    sessionId: z.string(),
  }),
  z.object({
    action: z.literal("hint"),
    sessionId: z.string(),
  }),
  z.object({
    action: z.literal("decide"),
    sessionId: z.string(),
    optionId: z.string(),
  }),
  z.object({
    action: z.literal("dynamic_event"),
    sessionId: z.string(),
  }),
  z.object({
    action: z.literal("advance"),
    sessionId: z.string(),
  }),
  z.object({
    action: z.literal("teach_back"),
    sessionId: z.string(),
    text: z.string().min(1),
  }),
  z.object({
    action: z.literal("request_teach_back"),
    sessionId: z.string(),
  }),
  z.object({
    action: z.literal("reflect"),
    sessionId: z.string(),
    reflections: z.array(z.string()),
  }),
  z.object({
    action: z.literal("transfer"),
    sessionId: z.string(),
    response: z.string().min(1),
  }),
]);

export async function POST(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const json = await request.json();
    const repo = getLearningRepository();

    if (json?.action) {
      const parsed = actionSchema.safeParse(json);
      if (!parsed.success) {
        return Response.json(
          { error: "Invalid session action.", code: "VALIDATION_ERROR" },
          { status: 400 },
        );
      }
      const data = parsed.data;
      switch (data.action) {
        case "predict":
          return Response.json({
            session: repo.submitPrediction(
              data.sessionId,
              data.optionId,
              data.confidencePrediction,
            ),
          });
        case "reveal_evidence": {
          const session = repo.getSession(data.sessionId);
          const evidence = repo.getScenarioEvidence(
            session.scenarioId,
            data.sessionId,
          );
          return Response.json({
            evidence,
            session: repo.getSession(data.sessionId),
          });
        }
        case "hint":
          return Response.json(repo.revealHint(data.sessionId));
        case "decide":
          return Response.json(repo.submitAccessDecision(data.sessionId, data.optionId));
        case "dynamic_event":
          return Response.json(repo.simulateDynamicEvent(data.sessionId));
        case "advance":
          return Response.json({ session: repo.advanceStage(data.sessionId) });
        case "request_teach_back":
          return Response.json(repo.requestTeachBack(data.sessionId));
        case "teach_back":
          return Response.json(repo.evaluateTeachBack(data.sessionId, data.text));
        case "reflect":
          return Response.json({
            session: repo.recordReflection(data.sessionId, data.reflections),
          });
        case "transfer":
          return Response.json({
            session: repo.completeTransfer(data.sessionId, data.response),
          });
        default: {
          const _exhaustive: never = data;
          return Response.json(
            { error: `Unhandled action`, details: _exhaustive },
            { status: 400 },
          );
        }
      }
    }

    const parsed = startSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        { error: "scenarioId is required.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    const session = repo.startScenario({
      userId,
      scenarioId: parsed.data.scenarioId,
      mode: parsed.data.mode,
    });
    const scenario = repo.getScenario(parsed.data.scenarioId);
    return Response.json({ session, scenario });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json({ error: "Learning session error." }, { status: 503 });
  }
}

export async function GET(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const sessionId = new URL(request.url).searchParams.get("sessionId");
    if (!sessionId) {
      return Response.json(
        { error: "sessionId is required.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    const repo = getLearningRepository();
    const session = repo.getSession(sessionId);
    if (session.userId !== userId && !process.env.ACCESS_INTELLIGENCE_DEMO_MODE) {
      // demo mode allows shared in-memory sessions
    }
    return Response.json({
      session,
      scenario: repo.getScenario(session.scenarioId),
    });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json({ error: "Could not load session." }, { status: 503 });
  }
}
