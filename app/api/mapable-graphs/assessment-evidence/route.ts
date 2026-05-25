import { ZodError } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requireGraphParticipantAccess } from "@/lib/mapable-graphs/api-auth";
import { assessmentEvidenceActionSchema } from "@/lib/mapable-graphs/schemas";
import {
  addAssessmentResult,
  addAssessmentTool,
  addDocumentEvidence,
  addParticipantNarrativeEvidence,
  graphService,
} from "@/lib/mapable-graphs/service";
import {
  linkAssessmentToFunctionalSignal,
  linkFunctionalSignalToSupportNeed,
} from "@/lib/mapable-graphs/graphs/assessment-evidence";
import { addFunctionalSignal } from "@/lib/mapable-graphs/graphs/participant-journey";

export async function POST(req: Request) {
  try {
    const body = assessmentEvidenceActionSchema.parse(await req.json());
    const access = await requireGraphParticipantAccess(body.participantId);
    if (access instanceof Response) return access;

    switch (body.action) {
      case "add_tool": {
        const tool = await addAssessmentTool(
          body.participantId,
          body.tool ?? "WHODAS"
        );
        return jsonOk({ tool }, 201);
      }
      case "add_result": {
        if (!body.nodeId) return jsonError("nodeId (tool) required", 400);
        const result = await addAssessmentResult(
          body.participantId,
          body.nodeId,
          body.label ?? "Assessment result",
          body.resultData ?? {}
        );
        return jsonOk({ result }, 201);
      }
      case "add_document": {
        const doc = await addDocumentEvidence(
          body.participantId,
          body.label ?? "Document",
          body.documentRef ?? "doc-unknown"
        );
        return jsonOk({ doc }, 201);
      }
      case "add_narrative": {
        const doc = await addParticipantNarrativeEvidence(
          body.participantId,
          body.narrative ?? ""
        );
        return jsonOk({ narrative: doc }, 201);
      }
      case "link_to_signal": {
        if (!body.nodeId) return jsonError("nodeId required", 400);
        const signal = await addFunctionalSignal(
          body.participantId,
          body.label ?? "Functional signal",
          { fromAssessment: true }
        );
        const edge = await linkAssessmentToFunctionalSignal(
          body.participantId,
          body.nodeId,
          signal.id
        );
        return jsonOk({ signal, edge }, 201);
      }
      case "link_signal_to_need": {
        const signalId = body.nodeId;
        const needs = await graphService.findNodes({
          graphType: "support_journey",
          participantId: body.participantId,
          nodeType: "SupportNeed",
        });
        const needId = needs[0]?.id;
        if (!signalId || !needId) {
          return jsonError("signal nodeId and support need required", 400);
        }
        const edge = await linkFunctionalSignalToSupportNeed(
          body.participantId,
          signalId,
          needId
        );
        return jsonOk({ edge });
      }
      default:
        return jsonError("Unknown action", 400);
    }
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Assessment evidence action failed", 500);
  }
}
