import { ZodError } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requireGraphParticipantAccess } from "@/lib/mapable-graphs/api-auth";
import { supportJourneyActionSchema } from "@/lib/mapable-graphs/schemas";
import {
  confirmSupportNeedGraph,
  createSupportJourney,
  generateRecommendation,
  graphService,
  inferSupportNeedFromLLM,
  rejectSupportNeedGraph,
} from "@/lib/mapable-graphs/service";

export async function POST(req: Request) {
  try {
    const body = supportJourneyActionSchema.parse(await req.json());
    const access = await requireGraphParticipantAccess(body.participantId);
    if (access instanceof Response) return access;

    switch (body.action) {
      case "create": {
        const graph = await createSupportJourney(
          body.participantId,
          body.actorId ?? access.id
        );
        return jsonOk({ graph }, 201);
      }
      case "infer_from_query": {
        if (!body.query) return jsonError("query required", 400);
        const result = await graphService.syncFromLlmClassification(
          body.participantId,
          body.query,
          body.actorId ?? access.id
        );
        return jsonOk(result, 201);
      }
      case "confirm_need": {
        const nodes = await graphService.findNodes({
          graphType: "support_journey",
          participantId: body.participantId,
          nodeType: "SupportNeed",
          entityId: body.supportNeedKey,
        });
        const nodeId = nodes[0]?.id;
        if (!nodeId) return jsonError("Support need not found", 404);
        const node = await confirmSupportNeedGraph(
          body.participantId,
          nodeId,
          body.actorId ?? access.id
        );
        return jsonOk({ node });
      }
      case "reject_need": {
        const nodes = await graphService.findNodes({
          graphType: "support_journey",
          participantId: body.participantId,
          nodeType: "SupportNeed",
          entityId: body.supportNeedKey,
        });
        const nodeId = nodes[0]?.id;
        if (!nodeId) return jsonError("Support need not found", 404);
        const node = await rejectSupportNeedGraph(
          body.participantId,
          nodeId,
          body.data?.reason as string | undefined,
          body.actorId ?? access.id
        );
        return jsonOk({ node });
      }
      case "generate_recommendation": {
        const needs = await graphService.findNodes({
          graphType: "support_journey",
          participantId: body.participantId,
          nodeType: "SupportNeed",
        });
        const needId = needs[0]?.id;
        if (!needId) return jsonError("No support need to link", 400);
        const rec = await generateRecommendation(
          body.participantId,
          needId,
          body.label ?? "Suggested support bundle",
          "Based on your confirmed goals and needs — draft only until you approve.",
          body.actorId ?? access.id
        );
        return jsonOk({ recommendation: rec }, 201);
      }
      default:
        return jsonError("Unknown action", 400);
    }
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Support journey action failed", 500);
  }
}
