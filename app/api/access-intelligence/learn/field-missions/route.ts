import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { getLearningRepository } from "@/lib/access-intelligence/learning/repository";

const schema = z.object({
  title: z.string().min(1),
  instructions: z.string().min(1),
  relatedScenarioId: z.string().optional(),
  dueAt: z.string().optional(),
});

export async function GET() {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    return Response.json({
      missions: getLearningRepository().listFieldMissions(userId),
    });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json({ error: "Could not list missions." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "title and instructions are required.", code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }
    const mission = getLearningRepository().createFieldMission({
      userId,
      ...parsed.data,
    });
    return Response.json({ mission });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json({ error: "Could not create mission." }, { status: 503 });
  }
}
