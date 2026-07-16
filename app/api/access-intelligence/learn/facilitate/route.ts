import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { getLearningRepository } from "@/lib/access-intelligence/learning/repository";
import { learningStageSchema } from "@/lib/access-intelligence/learning/schemas";

const createSchema = z.object({
  scenarioId: z.string().min(1),
  participantIds: z.array(z.string()).optional(),
  anonymousResponses: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const json = await request.json();
    const repo = getLearningRepository();

    if (json?.action === "pause") {
      const stage = learningStageSchema.parse(json.stage);
      return Response.json({
        session: repo.pauseFacilitatedSession(String(json.sessionId), stage),
      });
    }
    if (json?.action === "reveal") {
      return Response.json({
        session: repo.revealFacilitatedStage(
          String(json.sessionId),
          String(json.stageId),
        ),
      });
    }
    if (json?.action === "response") {
      return Response.json({
        session: repo.addFacilitatedResponse(String(json.sessionId), {
          id: `resp-${Date.now()}`,
          sessionId: String(json.sessionId),
          stage: learningStageSchema.parse(json.stage ?? "decision"),
          kind: json.kind ?? "decision",
          payload: json.payload ?? {},
          createdAt: new Date().toISOString(),
        }),
      });
    }
    if (json?.action === "export") {
      return Response.json(repo.exportFacilitatedSummary(String(json.sessionId)));
    }
    if (json?.action === "debrief") {
      const session = repo.getFacilitatedSession(String(json.sessionId));
      session.debriefNotes = String(json.notes ?? "");
      session.updatedAt = new Date().toISOString();
      return Response.json({ session });
    }

    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        { error: "scenarioId is required.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    const session = repo.createFacilitatedSession({
      facilitatorUserId: userId,
      ...parsed.data,
    });
    return Response.json({ session });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json({ error: "Facilitate error." }, { status: 503 });
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
    return Response.json({
      session: repo.getFacilitatedSession(sessionId),
      summary: repo.exportFacilitatedSummary(sessionId),
    });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json({ error: "Could not load session." }, { status: 503 });
  }
}
