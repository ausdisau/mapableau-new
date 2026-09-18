import { createAgentRun } from "@/lib/ai/agent-ops/agent-run-service";
import {
  runDurableMapAbleMission,
  type DurableMissionInput,
  type DurableMissionResult,
} from "@/lib/ai/platform/runtime/durable-mission-agent";

export async function runMapAbleAgentMissionStep(
  input: DurableMissionInput,
): Promise<DurableMissionResult> {
  "use step";

  const result = await runDurableMapAbleMission(input);

  await createAgentRun({
    agentType: "intake",
    actorUserId:
      input.actor.actorType === "system" ? undefined : input.actor.actorId,
    inputSummary: {
      missionId: input.missionId,
      domains: input.domains,
      objectiveLength: input.objective.length,
    },
    outputSummary: {
      source: result.source,
      activeAgentIds: result.activeAgentIds,
      authorityCeiling: result.authorityCeiling,
    },
    toolsCalled: [],
    guardrailsTriggered: result.humanReviewReasons,
    riskTier: result.requiresHumanReview ? "medium" : "low",
    humanReviewRequired: result.requiresHumanReview,
    participantConfirmationRequired: false,
  });

  return result;
}
