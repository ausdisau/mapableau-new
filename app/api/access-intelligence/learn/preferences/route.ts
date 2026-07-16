import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { getLearningRepository } from "@/lib/access-intelligence/learning/repository";

export async function GET() {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const repo = getLearningRepository();
    return Response.json({ preferences: repo.loadLearningPreferences(userId) });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json({ error: "Could not load preferences." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const body = (await request.json()) as Record<string, unknown>;
    const repo = getLearningRepository();
    const preferences = repo.saveLearningPreferences(userId, body);
    return Response.json({ preferences });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json({ error: "Could not save preferences." }, { status: 503 });
  }
}
