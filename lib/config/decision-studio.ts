/** Supported Decision Studio flags. All default false — no automatic execution. */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const decisionStudioConfig = {
  get enabled() {
    return envFlag("MAPABLE_DECISION_STUDIO_ENABLED", false);
  },
  get aiExplanationsEnabled() {
    return envFlag("MAPABLE_DECISION_AI_EXPLANATIONS_ENABLED", false);
  },
  get reversibleDecisionsEnabled() {
    return envFlag("MAPABLE_REVERSIBLE_DECISIONS_ENABLED", false);
  },
  authorityCeiling: "PARTICIPANT_SELECTS_ONLY" as const,
  productionClaimStatus: "not_claimable" as const,
  maturity: "contract_only" as const,
};
