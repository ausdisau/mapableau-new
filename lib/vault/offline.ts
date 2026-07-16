import { isVaultLocalStorageEnabled } from "@/lib/vault/config";
import { VaultDisabledError } from "@/lib/vault/registry";

/** Sensitive Vault content must never use plain localStorage. */
export const PLAIN_LOCAL_STORAGE_FORBIDDEN = true;

export type OfflineItemState =
  | "locally_available"
  | "last_synchronised"
  | "live_unavailable"
  | "capability_expired"
  | "revocation_pending"
  | "deletion_pending"
  | "stop_aura_pending"
  | "policy_change_pending";

export type OfflineDisclosureDraft = {
  id: string;
  purposeCode: string;
  requestedFields: string[];
  createdAt: string;
  status: "draft_local_only";
  issuanceBlockedReason: string;
};

const draftsByUser = new Map<string, OfflineDisclosureDraft[]>();

export function assertOfflineEnabled() {
  if (!isVaultLocalStorageEnabled()) {
    throw new VaultDisabledError("VAULT_LOCAL_STORAGE_DISABLED");
  }
}

export function assertNotPlainLocalStorage(): boolean {
  return PLAIN_LOCAL_STORAGE_FORBIDDEN;
}

/**
 * Offline may prepare a disclosure draft but must never issue or reuse approval.
 */
export function createOfflineDisclosureDraft(params: {
  ownerUserId: string;
  purposeCode: string;
  requestedFields: string[];
}): OfflineDisclosureDraft {
  assertOfflineEnabled();
  const draft: OfflineDisclosureDraft = {
    id: crypto.randomUUID(),
    purposeCode: params.purposeCode,
    requestedFields: params.requestedFields,
    createdAt: new Date().toISOString(),
    status: "draft_local_only",
    issuanceBlockedReason:
      "Offline mode cannot issue disclosures. On reconnect, recompile against current policy and require fresh approval.",
  };
  const list = draftsByUser.get(params.ownerUserId) ?? [];
  list.push(draft);
  draftsByUser.set(params.ownerUserId, list);
  return draft;
}

export function listOfflineDisclosureDrafts(ownerUserId: string) {
  assertOfflineEnabled();
  return draftsByUser.get(ownerUserId) ?? [];
}

export function describeOfflineRights() {
  return {
    permitted: [
      "view locally available items",
      "create a draft disclosure",
      "revoke local access",
      "delete a local copy",
      "stop AURA (queued)",
      "prepare export checklist",
    ],
    prohibited: [
      "issue a new external disclosure",
      "execute an old approval",
      "renew a capability",
      "accept a stale credential as current",
      "treat last-synced live access data as current",
    ],
    storageRule: "Never store sensitive Vault content in plain localStorage",
  };
}

export function resetOfflineDraftsForTests() {
  draftsByUser.clear();
}
