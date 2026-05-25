import { requireGraphParticipantAccess } from "@/lib/mapable-graphs/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  generateOutcomeSummary,
  graphService,
  validateBookingDependencies,
} from "@/lib/mapable-graphs/service";
import type { GraphType } from "@/lib/mapable-graphs/types";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ graphType: string; participantId: string }> }
) {
  const { graphType, participantId } = await ctx.params;
  const access = await requireGraphParticipantAccess(participantId);
  if (access instanceof Response) return access;

  switch (graphType as GraphType) {
    case "participant_journey": {
      const summary =
        await graphService.buildParticipantVisibleJourneySummary(
          participantId
        );
      return jsonOk({ summary });
    }
    case "support_journey": {
      const graph = await graphService.getGraphForParticipant(
        "support_journey",
        participantId
      );
      const needs = graph.nodes.filter((n) => n.nodeType === "SupportNeed");
      const recs = graph.nodes.filter((n) => n.nodeType === "Recommendation");
      const plans = graph.nodes.filter((n) => n.nodeType === "ServicePlan");
      return jsonOk({
        summary: {
          goal: graph.nodes.find((n) => n.nodeType === "Goal")?.label,
          supportNeeds: needs,
          suggestedSupports: recs,
          participantDecisions: needs.map((n) => ({
            label: n.label,
            status: n.status,
          })),
          nextReview: plans[0]?.data?.reviewDate ?? null,
          plainLanguage:
            "Review your support pathway. Confirm needs before bookings are created.",
        },
      });
    }
    case "booking": {
      const validation = await validateBookingDependencies(participantId);
      return jsonOk({ summary: validation });
    }
    case "outcome": {
      const summary = await generateOutcomeSummary(participantId);
      return jsonOk({ summary });
    }
    default:
      return jsonError("Summary not available for this graph type", 400);
  }
}
