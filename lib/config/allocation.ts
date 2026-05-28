export type CareAllocationAutonomyTierEnv =
  | "recommend_only"
  | "conditional_auto"
  | "org_default";

export const allocationConfig = {
  careAllocationEnabled: process.env.CARE_ALLOCATION_ENABLED === "true",
  autonomyTier: (process.env.CARE_ALLOCATION_AUTONOMY_TIER ??
    "recommend_only") as CareAllocationAutonomyTierEnv,
  autoMinScore: Number(process.env.CARE_ALLOCATION_AUTO_MIN_SCORE ?? "0.75"),
  requireFairnessReview:
    process.env.CARE_ALLOCATION_REQUIRE_FAIRNESS_REVIEW !== "false",
  maxProposalsPerRun: Number(
    process.env.CARE_ALLOCATION_MAX_PROPOSALS ?? "10"
  ),
};

export function resolveAutonomyTier(
  orgTier?: CareAllocationAutonomyTierEnv | null
): "recommend_only" | "conditional_auto" {
  const global = allocationConfig.autonomyTier;
  if (global === "org_default" && orgTier && orgTier !== "org_default") {
    return orgTier === "conditional_auto"
      ? "conditional_auto"
      : "recommend_only";
  }
  if (global === "conditional_auto") return "conditional_auto";
  return "recommend_only";
}
