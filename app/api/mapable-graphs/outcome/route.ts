import { ZodError } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requireGraphParticipantAccess } from "@/lib/mapable-graphs/api-auth";
import { outcomeGraphActionSchema } from "@/lib/mapable-graphs/schemas";
import {
  linkOutcomeToBooking,
  linkOutcomeToGoal,
  recordGoalProgress,
  recordServiceOutcome,
} from "@/lib/mapable-graphs/service";

export async function POST(req: Request) {
  try {
    const body = outcomeGraphActionSchema.parse(await req.json());
    const access = await requireGraphParticipantAccess(body.participantId);
    if (access instanceof Response) return access;

    const outcome = await recordServiceOutcome(
      body.participantId,
      body.outcomeType,
      body.label,
      { feedback: body.feedback, ...body.data }
    );

    if (body.goalNodeId) {
      await linkOutcomeToGoal(
        body.participantId,
        outcome.id,
        body.goalNodeId
      );
    }
    if (body.bookingNodeId) {
      await linkOutcomeToBooking(
        body.participantId,
        body.bookingNodeId,
        outcome.id
      );
    }

    if (body.outcomeType === "goal_progress" && body.goalNodeId) {
      await recordGoalProgress(
        body.participantId,
        body.goalNodeId,
        body.label,
        body.data
      );
    }

    return jsonOk({ outcome }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Outcome recording failed", 500);
  }
}
