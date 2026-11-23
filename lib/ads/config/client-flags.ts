/**
 * Client-safe ads enablement helpers.
 * Mirrors server flags via NEXT_PUBLIC_ mirrors when present; otherwise false.
 */

export type ClientAdsEnv = {
  NEXT_PUBLIC_MAPABLE_ADS_ENABLED?: string;
  NEXT_PUBLIC_MAPABLE_ADS_ACCESS_ENABLED?: string;
  NEXT_PUBLIC_MAPABLE_ADS_PROVIDER_FINDER_ENABLED?: string;
  NEXT_PUBLIC_MAPABLE_ADS_SPONSORED_PHRASE_ENABLED?: string;
  /** Optional client mirror of the global kill switch (fail-closed when "true"). */
  NEXT_PUBLIC_MAPABLE_ADS_GLOBAL_KILL_SWITCH?: string;
};

export function isClientAdsAccessEnabled(
  env: ClientAdsEnv = {
    NEXT_PUBLIC_MAPABLE_ADS_ENABLED:
      process.env.NEXT_PUBLIC_MAPABLE_ADS_ENABLED,
    NEXT_PUBLIC_MAPABLE_ADS_ACCESS_ENABLED:
      process.env.NEXT_PUBLIC_MAPABLE_ADS_ACCESS_ENABLED,
  },
): boolean {
  return (
    env.NEXT_PUBLIC_MAPABLE_ADS_ENABLED === "true" &&
    env.NEXT_PUBLIC_MAPABLE_ADS_ACCESS_ENABLED === "true"
  );
}

export function isClientAdsProviderFinderEnabled(
  env: ClientAdsEnv = {
    NEXT_PUBLIC_MAPABLE_ADS_ENABLED:
      process.env.NEXT_PUBLIC_MAPABLE_ADS_ENABLED,
    NEXT_PUBLIC_MAPABLE_ADS_PROVIDER_FINDER_ENABLED:
      process.env.NEXT_PUBLIC_MAPABLE_ADS_PROVIDER_FINDER_ENABLED,
  },
): boolean {
  return (
    env.NEXT_PUBLIC_MAPABLE_ADS_ENABLED === "true" &&
    env.NEXT_PUBLIC_MAPABLE_ADS_PROVIDER_FINDER_ENABLED === "true"
  );
}

/** Public Explore authored sponsored-phrase pilot (default off). */
export function isClientSponsoredPhraseEnabled(
  env: ClientAdsEnv = {
    NEXT_PUBLIC_MAPABLE_ADS_ENABLED:
      process.env.NEXT_PUBLIC_MAPABLE_ADS_ENABLED,
    NEXT_PUBLIC_MAPABLE_ADS_SPONSORED_PHRASE_ENABLED:
      process.env.NEXT_PUBLIC_MAPABLE_ADS_SPONSORED_PHRASE_ENABLED,
    NEXT_PUBLIC_MAPABLE_ADS_GLOBAL_KILL_SWITCH:
      process.env.NEXT_PUBLIC_MAPABLE_ADS_GLOBAL_KILL_SWITCH,
  },
): boolean {
  if (env.NEXT_PUBLIC_MAPABLE_ADS_GLOBAL_KILL_SWITCH === "true") {
    return false;
  }
  return (
    env.NEXT_PUBLIC_MAPABLE_ADS_ENABLED === "true" &&
    env.NEXT_PUBLIC_MAPABLE_ADS_SPONSORED_PHRASE_ENABLED === "true"
  );
}
