import {
  assertMapableAgentRuntimeReady,
  isMapableAgentConfigured,
  mapableAgentConfig,
} from "@/lib/mapable-agent/config";

export const careAgentConfig = {
  llmEnabled: process.env.CARE_AGENT_LLM_ENABLED === "true",
  fallbackToRules: process.env.CARE_AGENT_LLM_FALLBACK_TO_RULES !== "false",
  confidenceThreshold: Math.min(
    Math.max(Number(process.env.CARE_AGENT_LLM_CONFIDENCE_THRESHOLD ?? "0.75"), 0),
    1,
  ),
};

export function isCareAgentLlmEnabled(): boolean {
  return careAgentConfig.llmEnabled && isMapableAgentConfigured();
}

/** Ensures gpt-oss runtime is reachable when care LLM is enabled. */
export function assertCareAgentLlmReady(): void {
  if (!careAgentConfig.llmEnabled) return;
  if (!isMapableAgentConfigured()) {
    throw new Error(
      "CARE_AGENT_LLM_ENABLED requires MAPABLE_AGENT_ENABLED=true and model configuration.",
    );
  }
  assertMapableAgentRuntimeReady();
}

export function getCareAgentLlmProviderId(): string | undefined {
  if (!isCareAgentLlmEnabled()) return undefined;
  return mapableAgentConfig.modelProvider;
}
