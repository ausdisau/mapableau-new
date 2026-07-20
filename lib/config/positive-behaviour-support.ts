/**
 * MapAble Positive Behaviour Support — server-only feature flags.
 * All default false. Flags do not grant legal authority, practitioner
 * suitability, provider registration, or production readiness.
 */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const pbsConfig = {
  get enabled() {
    return envFlag("MAPABLE_PBS_ENABLED", false);
  },
  get aiAssistanceEnabled() {
    return envFlag("MAPABLE_PBS_AI_ASSISTANCE_ENABLED", false);
  },
  get externalModelEnabled() {
    return envFlag("MAPABLE_PBS_EXTERNAL_MODEL_ENABLED", false);
  },
  get restrictivePracticeWorkflowEnabled() {
    return envFlag("MAPABLE_PBS_RESTRICTIVE_PRACTICE_WORKFLOW_ENABLED", false);
  },
  get practitionerFinalisationEnabled() {
    return envFlag("MAPABLE_PBS_PRACTITIONER_FINALISATION_ENABLED", false);
  },
  get publicClaimEnabled() {
    return envFlag("MAPABLE_PBS_PUBLIC_CLAIM_ENABLED", false);
  },
  /** Default assistance ceiling — never raised by a flag alone. */
  authorityCeiling: "DRAFT_ONLY" as const,
  productionClaimStatus: "not_claimable" as const,
  maturity: "controlled_pilot" as const,
  publicClaimAllowed: false as const,
  externalModelEnabledByDefault: false as const,
};

export const PBS_FLAG_ENV_VARS = [
  "MAPABLE_PBS_ENABLED",
  "MAPABLE_PBS_AI_ASSISTANCE_ENABLED",
  "MAPABLE_PBS_EXTERNAL_MODEL_ENABLED",
  "MAPABLE_PBS_RESTRICTIVE_PRACTICE_WORKFLOW_ENABLED",
  "MAPABLE_PBS_PRACTITIONER_FINALISATION_ENABLED",
  "MAPABLE_PBS_PUBLIC_CLAIM_ENABLED",
] as const;

export class PbsDisabledError extends Error {
  constructor(message = "Positive Behaviour Support is disabled") {
    super(message);
    this.name = "PbsDisabledError";
  }
}

export function requirePbsEnabled(): void {
  if (!pbsConfig.enabled) {
    throw new PbsDisabledError();
  }
}

export function requirePbsAiAssistanceEnabled(): void {
  requirePbsEnabled();
  if (!pbsConfig.aiAssistanceEnabled) {
    throw new PbsDisabledError("PBS AI assistance is disabled");
  }
}

export function requirePbsExternalModelEnabled(): void {
  requirePbsAiAssistanceEnabled();
  if (!pbsConfig.externalModelEnabled) {
    throw new PbsDisabledError("PBS external model use is disabled");
  }
}

export function requirePbsPractitionerFinalisationEnabled(): void {
  requirePbsEnabled();
  if (!pbsConfig.practitionerFinalisationEnabled) {
    throw new PbsDisabledError("PBS practitioner finalisation is disabled");
  }
}

export function requirePbsRestrictivePracticeWorkflowEnabled(): void {
  requirePbsEnabled();
  if (!pbsConfig.restrictivePracticeWorkflowEnabled) {
    throw new PbsDisabledError("PBS restrictive practice workflow is disabled");
  }
}
