import { z } from "zod";

import { resolveAccessIntelligenceUserId } from "@/lib/access-intelligence/api-auth";
import { isAccessIntelligenceError } from "@/lib/access-intelligence/errors";
import { getLearningRepository } from "@/lib/access-intelligence/learning/repository";
import { learningScenarioSchema } from "@/lib/access-intelligence/learning/schemas";

export async function GET() {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const repo = getLearningRepository();
    return Response.json({
      scenarios: repo.listScenarios(),
      reviews: repo.listContentReviews(),
      governedBy: "LEARNING_GOVERNANCE",
    });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json({ error: "Could not load author studio." }, { status: 503 });
  }
}

const reviewActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("schedule_review"),
    scenarioId: z.string(),
    reviewType: z.enum([
      "accessibility",
      "lived_experience",
      "professional",
      "editorial",
    ]),
    reviewerName: z.string(),
    notes: z.string().optional(),
  }),
  z.object({
    action: z.literal("publish"),
    scenarioId: z.string(),
  }),
  z.object({
    action: z.literal("approve_review"),
    reviewId: z.string(),
  }),
]);

export async function POST(request: Request) {
  try {
    const userId = await resolveAccessIntelligenceUserId();
    if (userId instanceof Response) return userId;
    const json = await request.json();
    const repo = getLearningRepository();

    if (json?.action) {
      const parsed = reviewActionSchema.safeParse(json);
      if (!parsed.success) {
        return Response.json(
          { error: "Invalid author action.", code: "VALIDATION_ERROR" },
          { status: 400 },
        );
      }
      const data = parsed.data;
      switch (data.action) {
        case "schedule_review":
          return Response.json({
            review: repo.scheduleReview({
              scenarioId: data.scenarioId,
              reviewType: data.reviewType,
              reviewerName: data.reviewerName,
              notes: data.notes,
            }),
          });
        case "publish":
          return Response.json(repo.requestPublish(data.scenarioId));
        case "approve_review":
          return Response.json({ review: repo.approveContentReview(data.reviewId) });
        default: {
          const _exhaustive: never = data;
          return Response.json({ error: "Unhandled", details: _exhaustive }, { status: 400 });
        }
      }
    }

    const parsed = learningScenarioSchema.safeParse({
      ...json,
      published: false,
      author: json.author ?? userId,
      version: json.version ?? "0.1.0-draft",
    });
    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid scenario draft.",
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }
    const draft = repo.saveAuthorDraft(parsed.data);
    return Response.json({
      draft,
      note: "Draft saved unpublished. Required reviews must approve before publish.",
    });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      return Response.json(error.toPublicJson(), { status: 400 });
    }
    return Response.json({ error: "Author studio error." }, { status: 503 });
  }
}
