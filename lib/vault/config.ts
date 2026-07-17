import type { VaultMode } from "@/lib/vault/types";

/**
 * Server-side Personal Access Vault flags.
 * Browser query params must never enable enforcement.
 */
function envTrue(name: string): boolean {
  return process.env[name] === "true";
}

function envMode(): VaultMode {
  const raw = (process.env.MAPABLE_VAULT_MODE ?? "shadow").toLowerCase();
  if (
    raw === "demo" ||
    raw === "shadow" ||
    raw === "supervised" ||
    raw === "production"
  ) {
    return raw;
  }
  return "shadow";
}

export const vaultConfig = {
  enabled: envTrue("MAPABLE_PERSONAL_ACCESS_VAULT_ENABLED"),
  mode: envMode(),
  itemRegistryEnabled: envTrue("MAPABLE_VAULT_ITEM_REGISTRY_ENABLED"),
  encryptedStoreEnabled: envTrue("MAPABLE_VAULT_ENCRYPTED_STORE_ENABLED"),
  deviceTrustEnabled: envTrue("MAPABLE_VAULT_DEVICE_TRUST_ENABLED"),
  localStorageEnabled: envTrue("MAPABLE_VAULT_LOCAL_STORAGE_ENABLED"),
  capabilitiesEnabled: envTrue("MAPABLE_VAULT_CAPABILITIES_ENABLED"),
  selectiveDisclosureEnabled: envTrue(
    "MAPABLE_VAULT_SELECTIVE_DISCLOSURE_ENABLED"
  ),
  accessCapsulesEnabled: envTrue("MAPABLE_VAULT_ACCESS_CAPSULES_ENABLED"),
  delegationEnabled: envTrue("MAPABLE_VAULT_DELEGATION_ENABLED"),
  recoveryEnabled: envTrue("MAPABLE_VAULT_RECOVERY_ENABLED"),
  exportEnabled: envTrue("MAPABLE_VAULT_EXPORT_ENABLED"),
  importEnabled: envTrue("MAPABLE_VAULT_IMPORT_ENABLED"),
  deletionEnabled: envTrue("MAPABLE_VAULT_DELETION_ENABLED"),
  ledgerEnabled: envTrue("MAPABLE_VAULT_LEDGER_ENABLED"),
  enforceAura: envTrue("MAPABLE_VAULT_ENFORCE_AURA"),
  enforceAccess: envTrue("MAPABLE_VAULT_ENFORCE_ACCESS"),
  enforceTransport: envTrue("MAPABLE_VAULT_ENFORCE_TRANSPORT"),
  enforceCare: envTrue("MAPABLE_VAULT_ENFORCE_CARE"),
  enforceJobs: envTrue("MAPABLE_VAULT_ENFORCE_JOBS"),
  enforceHome: envTrue("MAPABLE_VAULT_ENFORCE_HOME"),
  enforcePartners: envTrue("MAPABLE_VAULT_ENFORCE_PARTNERS"),
  privateMatchingEnabled: envTrue("MAPABLE_VAULT_PRIVATE_MATCHING_ENABLED"),
  confidentialComputeEnabled: envTrue(
    "MAPABLE_VAULT_CONFIDENTIAL_COMPUTE_ENABLED"
  ),
  externalProviderEnabled: envTrue("MAPABLE_VAULT_EXTERNAL_PROVIDER_ENABLED"),
};

export function isPersonalAccessVaultEnabled(): boolean {
  return vaultConfig.enabled;
}

export function isVaultItemRegistryEnabled(): boolean {
  return vaultConfig.enabled && vaultConfig.itemRegistryEnabled;
}

export function isVaultLedgerEnabled(): boolean {
  return vaultConfig.enabled && vaultConfig.ledgerEnabled;
}

export function isVaultDeviceTrustEnabled(): boolean {
  return vaultConfig.enabled && vaultConfig.deviceTrustEnabled;
}

export function isVaultCapabilitiesEnabled(): boolean {
  return vaultConfig.enabled && vaultConfig.capabilitiesEnabled;
}

export function isVaultSelectiveDisclosureEnabled(): boolean {
  return vaultConfig.enabled && vaultConfig.selectiveDisclosureEnabled;
}

export function isVaultRecoveryEnabled(): boolean {
  return vaultConfig.enabled && vaultConfig.recoveryEnabled;
}

export function isVaultExportEnabled(): boolean {
  return vaultConfig.enabled && vaultConfig.exportEnabled;
}

export function isVaultImportEnabled(): boolean {
  return vaultConfig.enabled && vaultConfig.importEnabled;
}

export function isVaultDeletionEnabled(): boolean {
  return vaultConfig.enabled && vaultConfig.deletionEnabled;
}

export function isVaultEncryptedStoreEnabled(): boolean {
  return vaultConfig.enabled && vaultConfig.encryptedStoreEnabled;
}

export function isVaultLocalStorageEnabled(): boolean {
  return vaultConfig.enabled && vaultConfig.localStorageEnabled;
}

export function isVaultEnforcementActive(programme: string): boolean {
  if (!vaultConfig.enabled) return false;
  if (vaultConfig.mode === "demo" || vaultConfig.mode === "shadow") {
    return false;
  }
  switch (programme) {
    case "aura":
      return vaultConfig.enforceAura;
    case "access":
      return vaultConfig.enforceAccess;
    case "transport":
      return vaultConfig.enforceTransport;
    case "care":
      return vaultConfig.enforceCare;
    case "jobs":
      return vaultConfig.enforceJobs;
    case "home":
      return vaultConfig.enforceHome;
    case "partners":
      return vaultConfig.enforcePartners;
    default:
      return false;
  }
}

export const VAULT_NON_E2E_DISCLAIMER =
  "MapAble-managed Vault encryption is custodial. MapAble servers can decrypt vault-native payloads under policy. This is not end-to-end encryption.";

export const VAULT_DELETION_DISCLAIMER =
  "Deletion through the Vault removes Vault index entries and MapAble-controlled copies where possible. Recipient copies and backups may remain. Recipient deletion attestation is not independent proof of erasure.";

export const VAULT_ESSENTIAL_SERVICES_NOTE =
  "Essential MapAble services remain available without enabling advanced Vault, wallet, or credential features.";
