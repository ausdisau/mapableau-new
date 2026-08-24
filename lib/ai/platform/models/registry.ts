import type { DataClass } from "@/lib/ai/platform/types/classification";

/**
 * Canonical model registry — single source of truth for gateway allowlisting
 * and MapAble-native intelligence portfolio metadata.
 *
 * Do not hardcode "best model" assumptions. Suitability is declarative and
 * evaluation-gated; production promotion is never automatic.
 */

export type ModelProvider =
  | "ai_gateway"
  | "google"
  | "openai_compatible"
  | "local_oss"
  | "deterministic"
  | "disabled";

export type ModelDeploymentType =
  | "cloud_frontier"
  | "cloud_oss"
  | "local_oss"
  | "on_device"
  | "deterministic"
  | "disabled";

export type LatencyClass = "ultra_low" | "low" | "medium" | "high";
export type CostClass = "free_local" | "low" | "medium" | "high";

export type ModelEvaluationStatus =
  | "unevaluated"
  | "labs_only"
  | "shadow"
  | "eval_gated"
  | "approved_for_pilot"
  | "approved_for_production"
  | "suspended"
  | "retired";

export type ModelModality = "text" | "image" | "audio" | "structured";

export type DataResidencyClass =
  | "au_preferred"
  | "eu_ok"
  | "us_ok"
  | "local_only"
  | "unspecified";

export type ModelRegistration = {
  id: string;
  provider: ModelProvider;
  displayName: string;
  allowedTasks: string[];
  maxOutputTokens: number;
  supportsStructuredOutput: boolean;
  /** Portfolio / R&D metadata (optional for legacy entries; filled for native layer). */
  deploymentType?: ModelDeploymentType;
  taskSuitability?: string[];
  dataResidency?: DataResidencyClass;
  modalities?: ModelModality[];
  contextSizeTokens?: number;
  latencyClass?: LatencyClass;
  costClass?: CostClass;
  evaluationStatus?: ModelEvaluationStatus;
  approvedCapabilities?: string[];
  prohibitedDataClasses?: DataClass[];
  fallbackModelIds?: string[];
  /** When true, model is R&D / Labs only and must not silently replace production paths. */
  rndOnly?: boolean;
};

const SHARED_INTERPRETER_TASKS = [
  "search.nl_interpreter",
  "search.access_needs_interpreter",
  "provider_finder.reply_generator",
  "agent.disability_services",
  "agent.booking_services",
  "understanding.contextual",
  "relational.interpret",
  "relational.clarify",
  "navigator.provider_search.interpret",
  "navigator.provider_search.reply",
];

/** Candidate R&D task kinds — routed only when native-intelligence flags are on. */
export const NATIVE_INTELLIGENCE_TASK_KINDS = [
  "intent_classification",
  "domain_routing",
  "plain_language_explanation",
  "evidence_summarisation",
  "retrieval_reranking",
  "access_image_interpretation",
  "structured_extraction",
  "mission_explanation",
] as const;

export type NativeIntelligenceTaskKind =
  (typeof NATIVE_INTELLIGENCE_TASK_KINDS)[number];

const MODELS: ModelRegistration[] = [
  {
    id: "google/gemini-3.5-flash",
    provider: "ai_gateway",
    displayName: "Gemini 3.5 Flash (gateway)",
    allowedTasks: [...SHARED_INTERPRETER_TASKS],
    maxOutputTokens: 4096,
    supportsStructuredOutput: true,
    deploymentType: "cloud_frontier",
    taskSuitability: [
      "intent_classification",
      "plain_language_explanation",
      "evidence_summarisation",
      "structured_extraction",
      "mission_explanation",
    ],
    dataResidency: "unspecified",
    modalities: ["text", "structured"],
    contextSizeTokens: 1_000_000,
    latencyClass: "low",
    costClass: "medium",
    evaluationStatus: "approved_for_production",
    approvedCapabilities: [...SHARED_INTERPRETER_TASKS],
    prohibitedDataClasses: ["credentials_secrets", "safeguarding"],
    fallbackModelIds: ["openai/gpt-oss-120b", "disabled"],
    rndOnly: false,
  },
  {
    id: "openai/gpt-oss-120b",
    provider: "ai_gateway",
    displayName: "gpt-oss-120b (AI Gateway)",
    allowedTasks: [...SHARED_INTERPRETER_TASKS],
    maxOutputTokens: 4096,
    supportsStructuredOutput: true,
    deploymentType: "cloud_oss",
    taskSuitability: [
      "intent_classification",
      "domain_routing",
      "plain_language_explanation",
      "evidence_summarisation",
      "structured_extraction",
      "mission_explanation",
    ],
    dataResidency: "unspecified",
    modalities: ["text", "structured"],
    contextSizeTokens: 128_000,
    latencyClass: "medium",
    costClass: "medium",
    evaluationStatus: "approved_for_pilot",
    approvedCapabilities: [...SHARED_INTERPRETER_TASKS],
    prohibitedDataClasses: ["credentials_secrets", "safeguarding"],
    fallbackModelIds: ["disabled"],
    rndOnly: false,
  },
  {
    id: "mapable/local-small-intent-v0",
    provider: "local_oss",
    displayName: "MapAble local small intent (experimental)",
    allowedTasks: [
      "native.intent_classification",
      "native.domain_routing",
    ],
    maxOutputTokens: 512,
    supportsStructuredOutput: true,
    deploymentType: "local_oss",
    taskSuitability: ["intent_classification", "domain_routing"],
    dataResidency: "local_only",
    modalities: ["text", "structured"],
    contextSizeTokens: 4096,
    latencyClass: "ultra_low",
    costClass: "free_local",
    evaluationStatus: "labs_only",
    approvedCapabilities: [],
    prohibitedDataClasses: [
      "credentials_secrets",
      "safeguarding",
      "health_sensitive",
      "financial",
      "legal_privileged",
    ],
    fallbackModelIds: ["disabled"],
    rndOnly: true,
  },
  {
    id: "mapable/local-explain-v0",
    provider: "local_oss",
    displayName: "MapAble local explanation assist (experimental)",
    allowedTasks: [
      "native.plain_language_explanation",
      "native.mission_explanation",
      "native.retrieval_reranking",
    ],
    maxOutputTokens: 1024,
    supportsStructuredOutput: false,
    deploymentType: "local_oss",
    taskSuitability: [
      "plain_language_explanation",
      "mission_explanation",
      "retrieval_reranking",
    ],
    dataResidency: "local_only",
    modalities: ["text"],
    contextSizeTokens: 8192,
    latencyClass: "low",
    costClass: "free_local",
    evaluationStatus: "labs_only",
    approvedCapabilities: [],
    prohibitedDataClasses: [
      "credentials_secrets",
      "safeguarding",
      "health_sensitive",
      "financial",
      "legal_privileged",
    ],
    fallbackModelIds: ["disabled"],
    rndOnly: true,
  },
  {
    id: "disabled",
    provider: "disabled",
    displayName: "Disabled / deterministic fallback",
    allowedTasks: ["*"],
    maxOutputTokens: 0,
    supportsStructuredOutput: false,
    deploymentType: "disabled",
    taskSuitability: [],
    dataResidency: "local_only",
    modalities: [],
    contextSizeTokens: 0,
    latencyClass: "ultra_low",
    costClass: "free_local",
    evaluationStatus: "approved_for_production",
    approvedCapabilities: ["*"],
    prohibitedDataClasses: [],
    fallbackModelIds: [],
    rndOnly: false,
  },
];

export function listModels(): ModelRegistration[] {
  return [...MODELS];
}

export function getModel(id: string): ModelRegistration | undefined {
  return MODELS.find((m) => m.id === id);
}

export function isModelAllowedForTask(modelId: string, task: string): boolean {
  const model = getModel(modelId);
  if (!model) return false;
  if (model.provider === "disabled") return false;
  return model.allowedTasks.includes("*") || model.allowedTasks.includes(task);
}

export function listPortfolioModels(): ModelRegistration[] {
  return MODELS.filter((m) => m.provider !== "disabled");
}

export function isRndOnlyModel(modelId: string): boolean {
  const model = getModel(modelId);
  return Boolean(model?.rndOnly);
}

export function modelAllowsDataClass(
  modelId: string,
  dataClass: DataClass
): boolean {
  const model = getModel(modelId);
  if (!model) return false;
  if (model.provider === "disabled") return false;
  const prohibited = model.prohibitedDataClasses ?? [];
  return !prohibited.includes(dataClass);
}
