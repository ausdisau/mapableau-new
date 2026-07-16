import type { SourceType } from "./schemas";

/** Module configuration — weights and thresholds live here, not as magic numbers. */
export const accessIntelligenceConfig = {
  demoMode:
    process.env.ACCESS_INTELLIGENCE_DEMO_MODE !== "false" &&
    process.env.ACCESS_INTELLIGENCE_DEMO_MODE !== "0",
  maxChatBodyBytes: 120_000,
  maxAgentSteps: Number(process.env.ACCESS_INTELLIGENCE_MAX_STEPS ?? "12"),
  modelId:
    process.env.ACCESS_INTELLIGENCE_MODEL ??
    process.env.AI_MODEL ??
    process.env.SEARCH_INTERPRETER_MODEL ??
    "google/gemini-3.5-flash",
  aiGatewayApiKey:
    process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_AI_GATEWAY_API_KEY ?? "",
  googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
  provider: process.env.AI_PROVIDER ?? "google",
  demoUserId: "demo-access-intelligence-user",
} as const;

export const importanceWeights = {
  required: 0, // gate only — does not contribute to preference fit score
  preferred: 3,
  helpful: 1,
} as const;

export const sourceReliabilityDefaults: Record<SourceType, number> = {
  qualified_assessor: 1.0,
  system_feed: 0.95,
  trusted_partner: 0.88,
  trained_mapper: 0.82,
  venue_attestation: 0.75,
  community_report: 0.55,
  ai_inference: 0.25,
};

/** Days after which evidence of each feature type is considered stale. */
export const featureFreshnessDays: Partial<Record<string, number>> = {
  step_free: 365,
  clear_door_width_mm: 365,
  corridor_width_mm: 365,
  lift_door_width_mm: 365,
  lift: 90,
  accessible_toilet: 180,
  changing_places: 180,
  hearing_augmentation: 180,
  quiet_waiting_area: 90,
  default: 180,
};

export const routeCostWeights = {
  distance: 1,
  gradientPenalty: 40,
  narrowPathPenalty: 25,
  surfacePenalty: 20,
  sensoryPenalty: 15,
  uncertaintyPenalty: 80,
  temporaryConditionPenalty: 50,
  preferredLongerHighConfidenceBonus: 0.15,
} as const;

export const confidenceLabelThresholds = {
  high: 80,
  moderate: 60,
  limited: 35,
} as const;

export function isAccessIntelligenceAiConfigured(): boolean {
  return (
    accessIntelligenceConfig.aiGatewayApiKey.length > 0 ||
    accessIntelligenceConfig.googleApiKey.length > 0
  );
}

export function isDemoMode(): boolean {
  return (
    process.env.ACCESS_INTELLIGENCE_DEMO_MODE !== "false" &&
    process.env.ACCESS_INTELLIGENCE_DEMO_MODE !== "0"
  );
}
