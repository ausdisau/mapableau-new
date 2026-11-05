function enabled(name: string, defaultOn = false) {
  const value = process.env[name];
  if (value === undefined) return defaultOn;
  return value === "true";
}

/**
 * Coverage Care white-label pilot flags.
 * All new flags default OFF (fail-closed). Enable explicitly via env.
 */
export const coverageCareConfig = {
  get enabled() {
    return enabled("MAPABLE_COVERAGE_CARE_ENABLED");
  },
  get host() {
    return (
      process.env.MAPABLE_COVERAGE_CARE_HOST?.trim() ||
      "coveragecare.mapable.com.au"
    );
  },
  get brandOsEnabled() {
    return enabled("MAPABLE_COVERAGE_CARE_BRANDOS_ENABLED");
  },
  get provisioningPreviewEnabled() {
    return enabled("MAPABLE_COVERAGE_CARE_PROVISIONING_PREVIEW_ENABLED");
  },
  /**
   * Persistence backend for the pilot.
   * - `memory` (default): synthetic in-process store — no production DB writes
   * - `prisma`: use Prisma models (local migration only; not for production rollout)
   */
  get persistence(): "memory" | "prisma" {
    const value = process.env.MAPABLE_COVERAGE_CARE_PERSISTENCE?.trim();
    if (value === "prisma") return "prisma";
    return "memory";
  },
} as const;

export type CoverageCareConfig = typeof coverageCareConfig;

export function ensureCoverageCareEnabled() {
  if (!coverageCareConfig.enabled) {
    throw new Error("COVERAGE_CARE_DISABLED");
  }
}
