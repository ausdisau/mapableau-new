import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { getLearningRepository } from "@/lib/access-intelligence/learning/repository";
import {
  LEARNING_OBJECTIVES,
  listPublishedScenarios,
} from "@/lib/access-intelligence/learning/scenarios";

export async function GET() {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    return Response.json({
      scenarios: listPublishedScenarios().map((s) => ({
        id: s.id,
        title: s.title,
        humanGoal: s.humanGoal,
        audience: s.audience,
        version: s.version,
        objectiveIds: s.objectiveIds,
      })),
      objectives: LEARNING_OBJECTIVES,
    });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json({ error: "Could not list scenarios." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const body = (await request.json()) as { objectiveId?: string };
    if (!body.objectiveId) {
      return Response.json(
        { error: "objectiveId is required.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    const repo = getLearningRepository();
    const objective = repo.selectLearningObjective(userId, body.objectiveId);
    return Response.json({ objective });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json({ error: "Could not select objective." }, { status: 503 });
  }
}
