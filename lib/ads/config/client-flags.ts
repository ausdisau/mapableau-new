/**
 * Client-safe ads enablement helpers.
 * Mirrors server flags via NEXT_PUBLIC_ mirrors when present; otherwise false.
 */

export type ClientAdsEnv = {
  NEXT_PUBLIC_MAPABLE_ADS_ENABLED?: string;
  NEXT_PUBLIC_MAPABLE_ADS_ACCESS_ENABLED?: string;
  NEXT_PUBLIC_MAPABLE_ADS_PROVIDER_FINDER_ENABLED?: string;
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
