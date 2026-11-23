import { isProviderOpsEnabled } from "@/lib/config/provider-ops";

/**
 * ProviderCloud hosted surface for cloud.mapable.com.au.
 *
 * Premium correction: this is an included operations surface, not a paid
 * listing, pay-to-rank, or premium SKU. Environment variables cannot enable
 * commercial placement or supplier operations.
 */
export const providerCloudConfig = {
  serviceId: "providercloud" as const,
  title: "ProviderCloud",
  defaultHost: "cloud.mapable.com.au",
  identityStatus: "connected" as const,
  authorityCeiling: "READ_ONLY_HOSTED_SURFACE" as const,
  productionClaimStatus: "not_claimable" as const,
  maturity: "hosted_surface" as const,
  commercialProduct: false as const,
  premiumPlacement: false as const,
  paidRanking: false as const,
  autoEscalation: false as const,
  supplierOperationsEnabled: false as const,
} as const;

export type ProviderCloudConfig = typeof providerCloudConfig;

/** Always false. Env cannot enable premium placement or paid ranking. */
export function isProviderCloudPremiumEnabled(
  _env: NodeJS.ProcessEnv = process.env,
): false {
  return false;
}

/** Always false. Env cannot enable supplier operations. */
export function isProviderCloudSupplierOperationsEnabled(
  _env: NodeJS.ProcessEnv = process.env,
): false {
  return false;
}

export function getProviderCloudHost(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return env.MAPABLE_PROVIDERCLOUD_HOST ?? providerCloudConfig.defaultHost;
}

export function getProviderCloudOperationsSnapshot(
  env: NodeJS.ProcessEnv = process.env,
) {
  return {
    providerOpsEnabled: isProviderOpsEnabled(),
    supplierOperationsEnabled: isProviderCloudSupplierOperationsEnabled(env),
    premiumPlacement: isProviderCloudPremiumEnabled(env),
    paidRanking: providerCloudConfig.paidRanking,
    autoEscalation: providerCloudConfig.autoEscalation,
    commercialProduct: providerCloudConfig.commercialProduct,
  };
}
