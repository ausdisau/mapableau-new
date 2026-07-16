import type { CareIntakeResult, CareSupportTransformInput } from "@/server/agents/care/types";
import { runCareIntakeAgent } from "@/server/agents/care/careIntakeAgent";
import {
  assertCareAgentLlmReady,
  careAgentConfig,
  isCareAgentLlmEnabled,
} from "@/lib/care-agent/config";
import { CARE_INTAKE_SYSTEM_PROMPT } from "@/lib/care-agent/prompts";
import { careIntakeLlmSchema } from "@/lib/care-agent/schemas";
import { getMapableAgentModelProvider } from "@/lib/mapable-agent/model";

export type CareLlmStepMeta = {
  source: "llm" | "rules";
  confidence?: number;
  fallbackUsed: boolean;
  llmProvider?: string;
};

export type CareIntakeStepResult = {
  intake: CareIntakeResult;
  meta: CareLlmStepMeta;
};

function buildAuditFlags(riskSignals: CareIntakeResult["riskSignals"]): string[] {
  const auditFlags: string[] = [];
  if (riskSignals.includes("clinical_diagnosis_language")) {
    auditFlags.push("clinical_language_detected_not_used_for_diagnosis");
  }
  if (riskSignals.includes("ndis_eligibility_language")) {
    auditFlags.push("ndis_eligibility_language_detected_not_evaluated");
  }
  return auditFlags;
}

function mapLlmToIntake(
  input: CareSupportTransformInput,
  llm: {
    inferredRequestType: CareIntakeResult["inferredRequestType"];
    titleHint: string;
    schedulingHints: CareIntakeResult["schedulingHints"];
    riskSignals: CareIntakeResult["riskSignals"];
    linkedTransportRequired: boolean;
    accessNotesCandidate?: string;
  },
): CareIntakeResult {
  const normalizedMessage = input.message.trim().replace(/\s+/g, " ");
  return {
    normalizedMessage,
    inferredRequestType: llm.inferredRequestType,
    titleHint: llm.titleHint,
    schedulingHints: llm.schedulingHints,
    riskSignals: llm.riskSignals,
    linkedTransportRequired: llm.linkedTransportRequired,
    accessNotesCandidate: llm.accessNotesCandidate,
    auditFlags: buildAuditFlags(llm.riskSignals),
  };
}

export async function runCareIntakeWithLlm(
  input: CareSupportTransformInput,
): Promise<CareIntakeStepResult> {
  const rulesIntake = runCareIntakeAgent(input);
  const rulesMeta: CareLlmStepMeta = {
    source: "rules",
    fallbackUsed: false,
  };

  if (!isCareAgentLlmEnabled()) {
    return { intake: rulesIntake, meta: rulesMeta };
  }

  try {
    assertCareAgentLlmReady();
    const provider = getMapableAgentModelProvider();
    const llm = await provider.generateStructured({
      schema: careIntakeLlmSchema,
      messages: [
        { role: "system", content: CARE_INTAKE_SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            message: input.message,
            assessmentSignals: input.assessmentSignals,
            preferences: input.preferences,
          }),
        },
      ],
    });

    if (
      llm.confidence < careAgentConfig.confidenceThreshold &&
      careAgentConfig.fallbackToRules
    ) {
      return {
        intake: rulesIntake,
        meta: {
          source: "rules",
          confidence: llm.confidence,
          fallbackUsed: true,
          llmProvider: provider.id,
        },
      };
    }

    const shareAccessibility =
      input.preferences.shareAccessibility === true ||
      input.assessmentSignals.shareAccessibility === true;

    let accessNotesCandidate = llm.accessNotesCandidate;
    if (!shareAccessibility) {
      accessNotesCandidate = undefined;
    } else if (!accessNotesCandidate) {
      accessNotesCandidate = rulesIntake.accessNotesCandidate;
    }

    return {
      intake: mapLlmToIntake(input, {
        ...llm,
        accessNotesCandidate,
      }),
      meta: {
        source: "llm",
        confidence: llm.confidence,
        fallbackUsed: false,
        llmProvider: provider.id,
      },
    };
  } catch {
    if (!careAgentConfig.fallbackToRules) {
      throw new Error("Care intake LLM failed and fallback is disabled");
    }
    return {
      intake: rulesIntake,
      meta: {
        source: "rules",
        fallbackUsed: true,
      },
    };
  }
}
