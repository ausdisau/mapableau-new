import { ZodError } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requireGraphParticipantAccess } from "@/lib/mapable-graphs/api-auth";
import { guardrailEvaluateSchema } from "@/lib/mapable-graphs/schemas";
import {
  escalateSafeguarding,
  evaluateActionAgainstRulesGraph,
  graphService,
  recordPolicyDecision,
} from "@/lib/mapable-graphs/service";

export async function POST(req: Request) {
  try {
    const body = guardrailEvaluateSchema.parse(await req.json());
    const access = await requireGraphParticipantAccess(body.participantId);
    if (access instanceof Response) return access;

    const evaluation = await evaluateActionAgainstRulesGraph(
      body.participantId,
      body.action,
      body.context
    );

    if (evaluation.riskTier === "tier_4") {
      await escalateSafeguarding(
        body.participantId,
        evaluation.explanation,
        access.id
      );
    }

    const decision = await recordPolicyDecision(
      body.participantId,
      evaluation,
      body.action,
      access.id
    );

    await graphService.recordGraphEvent({
      graphType: "guardrail",
      participantId: body.participantId,
      eventType: "guardrail.evaluated",
      relatedNodeId: decision.id,
      actorId: access.id,
      payload: evaluation as unknown as Record<string, unknown>,
    });

    return jsonOk({
      evaluation,
      decision,
      participantMustConfirm:
        evaluation.outcome === "REQUIRE_PARTICIPANT_CONFIRMATION",
      humanReviewRequired:
        evaluation.outcome === "REQUIRE_HUMAN_REVIEW" ||
        evaluation.outcome === "ESCALATE_SAFEGUARDING",
      blocked: evaluation.outcome === "BLOCK",
    });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Guardrail evaluation failed", 500);
  }
}
