import { vaultConfig } from "@/lib/vault/config";
import { VaultDisabledError } from "@/lib/vault/registry";

/**
 * Wave 9 laboratory stubs — not production paths.
 * Prefer ordinary minimised server-side filtering until research gates pass.
 */
export function assertPrivateMatchingLabEnabled() {
  if (!vaultConfig.privateMatchingEnabled) {
    throw new VaultDisabledError("VAULT_PRIVATE_MATCHING_DISABLED");
  }
}

export function assertConfidentialComputeLabEnabled() {
  if (!vaultConfig.confidentialComputeEnabled) {
    throw new VaultDisabledError("VAULT_CONFIDENTIAL_COMPUTE_DISABLED");
  }
}

export function assertExternalProviderLabEnabled() {
  if (!vaultConfig.externalProviderEnabled) {
    throw new VaultDisabledError("VAULT_EXTERNAL_PROVIDER_DISABLED");
  }
}

export function privateMatchingLabStatus() {
  return {
    enabled: vaultConfig.privateMatchingEnabled,
    productionPath: false,
    recommendedApproach:
      "Ordinary server-side filtering with minimised fields and derived claims",
    deferred: [
      "private set intersection",
      "homomorphic approaches",
      "zero-knowledge predicates",
    ],
    killCriteria:
      "Do not place unproven cryptography in the initial production path",
  };
}

export function confidentialComputeLabStatus() {
  return {
    enabled: vaultConfig.confidentialComputeEnabled,
    productionPath: false,
    note: "Evaluate only when threat model shows material risk reduction beyond custodial KMS controls",
  };
}

export function externalProviderLabStatus() {
  return {
    enabled: vaultConfig.externalProviderEnabled,
    productionPath: false,
    note: "Federated PDS is Wave 9 laboratory only until accessibility and recovery requirements are met",
  };
}
