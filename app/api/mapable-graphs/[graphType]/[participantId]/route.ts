import { requireGraphParticipantAccess } from "@/lib/mapable-graphs/api-auth";
import { jsonError, jsonOk } from "@/lib/api/response";
import { graphService } from "@/lib/mapable-graphs/service";
import type { GraphType } from "@/lib/mapable-graphs/types";

const VALID_TYPES: GraphType[] = [
  "participant_journey",
  "support_journey",
  "booking",
  "outcome",
  "consent",
  "guardrail",
  "feedback",
  "provider_capability",
  "assessment_evidence",
];

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ graphType: string; participantId: string }> }
) {
  const { graphType, participantId } = await ctx.params;
  if (!VALID_TYPES.includes(graphType as GraphType)) {
    return jsonError("Invalid graph type", 400);
  }

  const access = await requireGraphParticipantAccess(participantId);
  if (access instanceof Response) return access;

  const graph = await graphService.getGraphForParticipant(
    graphType as GraphType,
    participantId
  );
  return jsonOk({ graph });
}
