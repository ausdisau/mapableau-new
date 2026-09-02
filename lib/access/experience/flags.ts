/**
 * Access Experience 2.0 feature flags — default off, fail-closed.
 * Independent of GAIS and Access Infrastructure flags.
 */

function envTruthy(key: string): boolean {
  const v = process.env[key];
  return v === "1" || v === "true" || v === "yes";
}

export const accessExperienceFlags = {
  get enabled() {
    return envTruthy("MAPABLE_ACCESS_EXPERIENCE_V2_ENABLED");
  },
};

export function isClientAccessExperienceV2Enabled(
  env: {
    NEXT_PUBLIC_MAPABLE_ACCESS_EXPERIENCE_V2_ENABLED?: string;
  } = {
    NEXT_PUBLIC_MAPABLE_ACCESS_EXPERIENCE_V2_ENABLED:
      process.env.NEXT_PUBLIC_MAPABLE_ACCESS_EXPERIENCE_V2_ENABLED,
  },
): boolean {
  return env.NEXT_PUBLIC_MAPABLE_ACCESS_EXPERIENCE_V2_ENABLED === "true";
}

export function assertAccessExperienceEnabled(): void {
  if (!accessExperienceFlags.enabled) {
    throw new AccessExperienceDisabledError();
  }
}

export class AccessExperienceDisabledError extends Error {
  readonly status = 404;

  constructor() {
    super(
      "Access Experience 2.0 is disabled (MAPABLE_ACCESS_EXPERIENCE_V2_ENABLED)",
    );
    this.name = "AccessExperienceDisabledError";
  }
}
