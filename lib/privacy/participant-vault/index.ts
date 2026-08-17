export {
  FORBIDDEN_SHARE_PURPOSES,
  MAX_SHARE_TTL_DAYS,
  VAULT_AUDIT_ACTIONS,
  VAULT_ITEM_KINDS,
  VaultError,
  vaultErrorResponse,
  type VaultItemKind,
} from "./errors";
export { isParticipantInformationVaultEnabled } from "./flags";
export {
  attachVaultItemSchema,
  revokeVaultShareSchema,
  shareVaultItemSchema,
  vaultItemKindSchema,
} from "./schemas";
export {
  addVaultItem,
  getVaultItem,
  listVaultItems,
  removeVaultItem,
  revokeVaultShare,
  shareVaultItem,
  type AddVaultItemInput,
  type ListVaultItemsResult,
  type ShareVaultItemInput,
} from "./service";
export type { VaultGrantSummary, VaultItemSummary } from "./types";
