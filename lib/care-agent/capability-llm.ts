import type {
  CareIntakeResult,
  CarePlanDraft,
  WorkerCapabilityRequirement,
} from "@/server/agents/care/types";
import { runWorkerCapabilityAgent } from "@/server/agents/care/workerCapabilityAgent";
import {
  assertCareAgentLlmReady,
  careAgentConfig,
  isCareAgentLlmEnabled,
} from "@/lib/care-agent/config";
import type { CareLlmStepMeta } from "@/lib/care-agent/intake-llm";
import { CARE_CAPABILITY_SYSTEM_PROMPT } from "@/lib/care-agent/prompts";
import {
  careCapabilityLlmSchema,
  LLM_ALLOWED_CAPABILITY_IDS,
} from "@/lib/care-agent/schemas";
import { getMapableAgentModelProvider } from "@/lib/mapable-agent/model";

export type CareCapabilityStepResult = {
  requiredCapabilities: WorkerCapabilityRequirement[];
  meta: CareLlmStepMeta;
};

const LLM_CAPABILITY_LABELS: Record<string, { label: string; reason: string }> = {
  manual_handling_awareness: {
    label: "Manual handling awareness",
    reason: "LLM flagged manual handling — staff review required.",
  },
  medication_prompting_supervision: {
    label: "Medication prompting supervision",
    reason: "LLM flagged medication prompting — policy and human review required.",
  },
  behaviour_support: {
    label: "Behaviour support capability",
    reason: "LLM flagged behaviour support — qualified review before matching.",
  },
  safeguarding_review: {
    label: "Safeguarding review",
    reason: "LLM flagged safeguarding — authorised human review required.",
  },
  high_intensity_competency: {
    label: "High-intensity competency",
    reason: "LLM flagged high-intensity support needs.",
  },
  personal_care_scope: {
    label: "Personal care scope",
    reason: "LLM flagged personal care — participant confirmation required.",
  },
  care_transport_coordination: {
    label: "Care and transport coordination",
    reason: "LLM suggested linked transport coordination.",
  },
};

function mergeCapabilities(
  base: WorkerCapabilityRequirement[],
  extraIds: string[],
): WorkerCapabilityRequirement[] {
  const byId = new Map(base.map((c) => [c.id, c]));
  for (const id of extraIds) {
    if (byId.has(id)) continue;
    const meta = LLM_CAPABILITY_LABELS[id];
    if (!meta) continue;
    byId.set(id, {
      id,
      label: meta.label,
      reason: meta.reason,
      required: id !== "care_transport_coordination",
    });
  }
  return [...byId.values()];
}

export async function runWorkerCapabilityWithLlm(
  intake: CareIntakeResult,
  carePlanDraft: CarePlanDraft,
): Promise<CareCapabilityStepResult> {
  const rulesCapabilities = runWorkerCapabilityAgent(intake, carePlanDraft);
  const rulesMeta: CareLlmStepMeta = {
    source: "rules",
    fallbackUsed: false,
  };

  if (!isCareAgentLlmEnabled()) {
    return { requiredCapabilities: rulesCapabilities, meta: rulesMeta };
  }

  try {
    assertCareAgentLlmReady();
    const provider = getMapableAgentModelProvider();
    const llm = await provider.generateStructured({
      schema: careCapabilityLlmSchema,
      messages: [
        { role: "system", content: CARE_CAPABILITY_SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            allowedCapabilityIds: LLM_ALLOWED_CAPABILITY_IDS,
            requestType: carePlanDraft.requestType,
            riskSignals: intake.riskSignals,
            tasks: carePlanDraft.tasks,
            linkedTransportRequired: carePlanDraft.linkedTransportRequired,
          }),
        },
      ],
    });

    const allowed = llm.capabilityIds.filter((id) =>
      (LLM_ALLOWED_CAPABILITY_IDS as readonly string[]).includes(id),
    );

    if (
      llm.confidence < careAgentConfig.confidenceThreshold &&
      careAgentConfig.fallbackToRules
    ) {
      return {
        requiredCapabilities: rulesCapabilities,
        meta: {
          source: "rules",
          confidence: llm.confidence,
          fallbackUsed: true,
          llmProvider: provider.id,
        },
      };
    }

    return {
      requiredCapabilities: mergeCapabilities(rulesCapabilities, allowed),
      meta: {
        source: "llm",
        confidence: llm.confidence,
        fallbackUsed: false,
        llmProvider: provider.id,
      },
    };
  } catch {
    if (!careAgentConfig.fallbackToRules) {
      throw new Error("Care capability LLM failed and fallback is disabled");
    }
    return {
      requiredCapabilities: rulesCapabilities,
      meta: { source: "rules", fallbackUsed: true },
    };
  }
}
