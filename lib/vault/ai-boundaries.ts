/**
 * AI may explain and prepare; it must not decide authority, crypto, or disclosure expansion.
 * Tools receive server-built authority context only.
 */

export const VAULT_AI_ALLOWED_TOOLS = [
  "listVaultItems",
  "readVaultItemLabel",
  "explainVaultItem",
  "compareStorageOptions",
  "previewDisclosure",
  "explainDisclosureDiff",
  "prepareCapabilityRequest",
  "readActiveCapabilities",
  "explainRecoveryOptions",
  "prepareExport",
  "explainDeletionScope",
  "prepareHumanPrivacyOfficerRequest",
] as const;

export const VAULT_AI_PROHIBITED = [
  "select_encryption_keys",
  "determine_canonical_routing",
  "classify_sensitivity",
  "create_consent",
  "create_authority",
  "expand_disclosure_fields",
  "issue_capability",
  "approve_export",
  "approve_recovery",
  "approve_deletion",
  "cryptographically_verify_credential",
  "determine_legal_retention",
  "infer_durable_preferences",
  "train_on_vault_data",
  "receive_raw_key_material",
  "receive_object_storage_credentials",
  "receive_complete_vault_access",
  "direct_database_write",
] as const;

export type VaultAiAuthorityContext = {
  ownerUserId: string;
  permittedTool: (typeof VAULT_AI_ALLOWED_TOOLS)[number];
  itemIds?: string[];
  purposeCode?: string;
};

export function assertVaultAiToolAllowed(
  tool: string,
  context: VaultAiAuthorityContext
): void {
  if (!(VAULT_AI_ALLOWED_TOOLS as readonly string[]).includes(tool)) {
    throw new Error("VAULT_AI_TOOL_NOT_ALLOWED");
  }
  if (!context.ownerUserId) {
    throw new Error("VAULT_AI_AUTHORITY_CONTEXT_REQUIRED");
  }
  if (context.permittedTool !== tool) {
    throw new Error("VAULT_AI_TOOL_CONTEXT_MISMATCH");
  }
}

export function isVaultAiProhibited(action: string): boolean {
  return (VAULT_AI_PROHIBITED as readonly string[]).includes(action);
}
