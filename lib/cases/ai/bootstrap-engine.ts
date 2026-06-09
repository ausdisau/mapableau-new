import { caseManagementConfig } from "@/lib/config/case-management";

import { getCaseAIEngine, setCaseAIEngine } from "./engine";
import { createLLMCaseAIEngine } from "./llm-engine";

let bootstrapped = false;

/**
 * Install LLM case engine when CASE_MANAGEMENT_AI_ENGINE=llm and interpreter is configured.
 * Safe to call multiple times — only runs once per process.
 */
export function bootstrapCaseAIEngine() {
  if (bootstrapped) return getCaseAIEngine();
  bootstrapped = true;

  const engineMode = process.env.CASE_MANAGEMENT_AI_ENGINE ?? "rules";
  if (engineMode === "llm" && caseManagementConfig.aiEnabled) {
    setCaseAIEngine(createLLMCaseAIEngine());
  }

  return getCaseAIEngine();
}
