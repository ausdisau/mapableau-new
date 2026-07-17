/** Public Accountability Portal configuration (Wave 1). */

export const DEFAULT_PUBLIC_COHORT_THRESHOLD = 10;

export const DEMONSTRATION_DATA_BANNER =
  "Demonstration data. Not a production claim.";

export const SUPPRESSED_DATA_NOTICE =
  "Not published because the group is too small to protect privacy.";

export const ACCOUNTABILITY_EXTERNAL_REPORTING_DISCLAIMER =
  "Aggregated publication on this portal does not replace formal complaint, emergency, police or regulatory reporting pathways.";

export const accountabilityConfig = {
  portalEnabled: process.env.ACCOUNTABILITY_PORTAL_ENABLED !== "false",
  publicApiEnabled: process.env.ACCOUNTABILITY_PUBLIC_API_ENABLED !== "false",
  defaultCohortThreshold: Number(
    process.env.ACCOUNTABILITY_COHORT_THRESHOLD ??
      String(DEFAULT_PUBLIC_COHORT_THRESHOLD)
  ),
  corsAllowList: (process.env.ACCOUNTABILITY_API_CORS_ALLOWLIST ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  allowDemoSeed:
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_ACCOUNTABILITY_DEMO_SEED !== "false",
};
