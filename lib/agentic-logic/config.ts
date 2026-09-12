export const featureFlags = {
  MAPABLE_AGENTIC_LOGIC_ENABLED: (process.env.MAPABLE_AGENTIC_LOGIC_ENABLED || "false") === "true",
  MAPABLE_RELATIONAL_INFERENCE_ENABLED: (process.env.MAPABLE_RELATIONAL_INFERENCE_ENABLED || "false") === "true",
  MAPABLE_WEIGHTED_RULES_ENABLED: (process.env.MAPABLE_WEIGHTED_RULES_ENABLED || "false") === "true",
  MAPABLE_LOGIC_AURA_BRIDGE_ENABLED: (process.env.MAPABLE_LOGIC_AURA_BRIDGE_ENABLED || "false") === "true",
  MAPABLE_LOGIC_WEIGHT_LEARNING_ENABLED: (process.env.MAPABLE_LOGIC_WEIGHT_LEARNING_ENABLED || "false") === "true",
};

export type FeatureFlags = typeof featureFlags;
