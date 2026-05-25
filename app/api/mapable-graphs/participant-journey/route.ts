import { ZodError } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requireGraphParticipantAccess } from "@/lib/mapable-graphs/api-auth";
import { participantJourneyActionSchema } from "@/lib/mapable-graphs/schemas";
import {
  addEnvironmentalBarrier,
  addFunctionalSignal,
  addParticipantGoal,
  addParticipantPreference,
  applyParticipantCorrection,
  confirmInterpretation,
  createParticipantJourneyGraph,
} from "@/lib/mapable-graphs/service";

export async function POST(req: Request) {
  try {
    const body = participantJourneyActionSchema.parse(await req.json());
    const access = await requireGraphParticipantAccess(body.participantId);
    if (access instanceof Response) return access;

    switch (body.action) {
      case "create": {
        const graph = await createParticipantJourneyGraph(
          body.participantId,
          body.actorId ?? access.id
        );
        return jsonOk({ graph }, 201);
      }
      case "add_goal": {
        const node = await addParticipantGoal(
          body.participantId,
          body.label ?? "Goal",
          body.key,
          body.actorId ?? access.id
        );
        return jsonOk({ node }, 201);
      }
      case "add_preference": {
        const node = await addParticipantPreference(
          body.participantId,
          body.label ?? "Preference",
          body.actorId ?? access.id
        );
        return jsonOk({ node }, 201);
      }
      case "add_functional_signal": {
        const node = await addFunctionalSignal(
          body.participantId,
          body.label ?? "Signal",
          body.data,
          body.actorId ?? access.id
        );
        return jsonOk({ node }, 201);
      }
      case "add_environmental_barrier": {
        const node = await addEnvironmentalBarrier(
          body.participantId,
          body.label ?? "Barrier",
          body.nodeId,
          body.actorId ?? access.id
        );
        return jsonOk({ node }, 201);
      }
      case "confirm": {
        if (!body.nodeId) return jsonError("nodeId required", 400);
        const node = await confirmInterpretation(
          body.participantId,
          body.nodeId,
          body.actorId ?? access.id
        );
        return jsonOk({ node });
      }
      case "correct": {
        if (!body.nodeId) return jsonError("nodeId required", 400);
        const node = await applyParticipantCorrection(
          body.participantId,
          body.nodeId,
          body.data ?? {},
          body.actorId ?? access.id
        );
        return jsonOk({ node });
      }
      default:
        return jsonError("Unknown action", 400);
    }
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Participant journey action failed", 500);
  }
}
