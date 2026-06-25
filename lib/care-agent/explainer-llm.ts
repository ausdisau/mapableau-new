import type {
  CareGuardrailResult,
  CareIntakeResult,
  CarePlanDraft,
  WorkerCapabilityRequirement,
} from "@/server/agents/care/types";
import { runCarePlanExplainer } from "@/server/agents/care/carePlanExplainer";
import {
  assertCareAgentLlmReady,
  careAgentConfig,
  isCareAgentLlmEnabled,
} from "@/lib/care-agent/config";
import type { CareLlmStepMeta } from "@/lib/care-agent/intake-llm";
import { CARE_EXPLAINER_SYSTEM_PROMPT } from "@/lib/care-agent/prompts";
import { careExplainerLlmSchema } from "@/lib/care-agent/schemas";
import { getMapableAgentModelProvider } from "@/lib/mapable-agent/model";

export type CareExplainerStepResult = {
  summary: string;
  meta: CareLlmStepMeta;
};

export async function runCarePlanExplainerWithLlm(params: {
  intake: CareIntakeResult;
  carePlanDraft: CarePlanDraft;
  guardrail: CareGuardrailResult;
  requiredCapabilities: WorkerCapabilityRequirement[];
}): Promise<CareExplainerStepResult> {
  const rulesSummary = runCarePlanExplainer(params);
  const rulesMeta: CareLlmStepMeta = {
    source: "rules",
    fallbackUsed: false,
  };

  if (!isCareAgentLlmEnabled()) {
    return { summary: rulesSummary, meta: rulesMeta };
  }

  try {
    assertCareAgentLlmReady();
    const provider = getMapableAgentModelProvider();
    const llm = await provider.generateStructured({
      schema: careExplainerLlmSchema,
      messages: [
        { role: "system", content: CARE_EXPLAINER_SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            requestType: params.carePlanDraft.requestType,
            title: params.carePlanDraft.title,
            tasks: params.carePlanDraft.tasks.map((t) => t.name),
            humanReviewRequired: params.guardrail.guardrailDecision.humanReviewRequired,
            missingInformation: params.guardrail.missingInformation,
          }),
        },
      ],
    });

    if (
      llm.confidence < careAgentConfig.confidenceThreshold &&
      careAgentConfig.fallbackToRules
    ) {
      return {
        summary: rulesSummary,
        meta: {
          source: "rules",
          confidence: llm.confidence,
          fallbackUsed: true,
          llmProvider: provider.id,
        },
      };
    }

    return {
      summary: llm.summary.trim(),
      meta: {
        source: "llm",
        confidence: llm.confidence,
        fallbackUsed: false,
        llmProvider: provider.id,
      },
    };
  } catch {
    if (!careAgentConfig.fallbackToRules) {
      throw new Error("Care explainer LLM failed and fallback is disabled");
    }
    return {
      summary: rulesSummary,
      meta: { source: "rules", fallbackUsed: true },
    };
  }
}
