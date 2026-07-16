import type {
  CareIntakeResult,
  CarePlanDraft,
  CareSupportTransformInput,
  StructuredCareTask,
} from "@/server/agents/care/types";
import { runCareTaskTransformer } from "@/server/agents/care/careTaskTransformer";
import {
  assertCareAgentLlmReady,
  careAgentConfig,
  isCareAgentLlmEnabled,
} from "@/lib/care-agent/config";
import type { CareLlmStepMeta } from "@/lib/care-agent/intake-llm";
import { CARE_TASK_SYSTEM_PROMPT } from "@/lib/care-agent/prompts";
import { careTaskLlmSchema } from "@/lib/care-agent/schemas";
import { getMapableAgentModelProvider } from "@/lib/mapable-agent/model";

export type CareTaskStepResult = {
  carePlanDraft: CarePlanDraft;
  meta: CareLlmStepMeta;
};

function buildDraftFromTasks(
  input: CareSupportTransformInput,
  intake: CareIntakeResult,
  tasks: StructuredCareTask[],
): CarePlanDraft {
  const shareAccessibility =
    input.preferences.shareAccessibility === true ||
    input.assessmentSignals.shareAccessibility === true;
  const shareAccessibilityConfirmed =
    input.preferences.shareAccessibilityConfirmed === true;
  const scheduling = intake.schedulingHints;

  return {
    status: "needs_confirmation",
    bookingStatus: "blocked_until_participant_confirmation",
    requestType: intake.inferredRequestType,
    title: intake.titleHint,
    description: intake.normalizedMessage,
    preferredDate: scheduling.preferredDate,
    startTime: scheduling.startTime,
    endTime: scheduling.endTime,
    suburb: scheduling.locationHint,
    accessRequirementsSummary: shareAccessibilityConfirmed
      ? intake.accessNotesCandidate
      : undefined,
    linkedTransportRequired: intake.linkedTransportRequired,
    shareAccessibility,
    shareAccessibilityConfirmed,
    tasks,
    autoAssignWorkers: false,
    autoFinalizeBooking: false,
  };
}

export async function runCareTaskTransformerWithLlm(
  input: CareSupportTransformInput,
  intake: CareIntakeResult,
): Promise<CareTaskStepResult> {
  const rulesDraft = runCareTaskTransformer(input, intake);
  const rulesMeta: CareLlmStepMeta = {
    source: "rules",
    fallbackUsed: false,
  };

  if (!isCareAgentLlmEnabled()) {
    return { carePlanDraft: rulesDraft, meta: rulesMeta };
  }

  try {
    assertCareAgentLlmReady();
    const provider = getMapableAgentModelProvider();
    const llm = await provider.generateStructured({
      schema: careTaskLlmSchema,
      messages: [
        { role: "system", content: CARE_TASK_SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            message: intake.normalizedMessage,
            requestType: intake.inferredRequestType,
            riskSignals: intake.riskSignals,
          }),
        },
      ],
    });

    if (
      llm.confidence < careAgentConfig.confidenceThreshold &&
      careAgentConfig.fallbackToRules
    ) {
      return {
        carePlanDraft: rulesDraft,
        meta: {
          source: "rules",
          confidence: llm.confidence,
          fallbackUsed: true,
          llmProvider: provider.id,
        },
      };
    }

    const tasks: StructuredCareTask[] = llm.tasks.map((t) => ({
      name: t.name,
      intensity: t.intensity,
      source: "message" as const,
    }));

    return {
      carePlanDraft: buildDraftFromTasks(input, intake, tasks),
      meta: {
        source: "llm",
        confidence: llm.confidence,
        fallbackUsed: false,
        llmProvider: provider.id,
      },
    };
  } catch {
    if (!careAgentConfig.fallbackToRules) {
      throw new Error("Care task LLM failed and fallback is disabled");
    }
    return {
      carePlanDraft: rulesDraft,
      meta: {
        source: "rules",
        fallbackUsed: true,
      },
    };
  }
}
