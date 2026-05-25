import { ZodError } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requireGraphParticipantAccess } from "@/lib/mapable-graphs/api-auth";
import { feedbackGraphActionSchema } from "@/lib/mapable-graphs/schemas";
import {
  recordComplaint,
  recordLearningSignal,
  recordParticipantConfirmation,
  recordParticipantEdit,
  recordParticipantRejection,
} from "@/lib/mapable-graphs/service";

export async function POST(req: Request) {
  try {
    const body = feedbackGraphActionSchema.parse(await req.json());
    const access = await requireGraphParticipantAccess(body.participantId);
    if (access instanceof Response) return access;

    const actorId = body.actorId ?? access.id;

    switch (body.feedbackType) {
      case "confirmation": {
        if (!body.targetNodeId) return jsonError("targetNodeId required", 400);
        const feedback = await recordParticipantConfirmation(
          body.participantId,
          body.targetNodeId,
          actorId
        );
        return jsonOk({ feedback }, 201);
      }
      case "edit": {
        if (!body.targetNodeId) return jsonError("targetNodeId required", 400);
        const feedback = await recordParticipantEdit(
          body.participantId,
          body.targetNodeId,
          body.data ?? {},
          actorId
        );
        return jsonOk({ feedback }, 201);
      }
      case "rejection": {
        if (!body.targetNodeId) return jsonError("targetNodeId required", 400);
        const feedback = await recordParticipantRejection(
          body.participantId,
          body.targetNodeId,
          body.message,
          actorId
        );
        return jsonOk({ feedback }, 201);
      }
      case "complaint": {
        const complaint = await recordComplaint(
          body.participantId,
          body.message ?? "Complaint",
          actorId
        );
        return jsonOk({ complaint }, 201);
      }
      case "learning_signal": {
        const signal = await recordLearningSignal(
          body.participantId,
          body.message ?? "learning",
          body.targetNodeId
        );
        return jsonOk({ signal }, 201);
      }
      default:
        return jsonError("Unknown feedback type", 400);
    }
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Feedback recording failed", 500);
  }
}
