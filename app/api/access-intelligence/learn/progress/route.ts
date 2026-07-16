import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { getLearningRepository } from "@/lib/access-intelligence/learning/repository";
import { LEARNING_OBJECTIVES } from "@/lib/access-intelligence/learning/scenarios";

export async function GET() {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const repo = getLearningRepository();
    const mastery = repo.listMastery(userId);
    const missions = repo.listFieldMissions(userId);
    return Response.json({
      mastery,
      missions,
      concepts: LEARNING_OBJECTIVES.map((o) => ({
        objectiveId: o.id,
        conceptId: o.concepts[0],
        title: o.title,
      })),
      leaderboard: null,
      note: "Mastery is tracked by concept. There are no public leaderboards.",
    });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json({ error: "Could not load progress." }, { status: 503 });
  }
}
