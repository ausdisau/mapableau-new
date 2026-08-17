export const VAULT_ITEM_KINDS = [
  "identity",
  "plan",
  "agreement",
  "note",
  "other",
] as const;

export type VaultItemKind = (typeof VAULT_ITEM_KINDS)[number];

export const VAULT_AUDIT_ACTIONS = {
  itemAdded: "vault.item_added",
  shareGranted: "vault.share_granted",
  shareRevoked: "vault.share_revoked",
  itemRemoved: "vault.item_removed",
} as const;

export const FORBIDDEN_SHARE_PURPOSES = new Set(["access_evidence_photo"]);

/** Maximum share lifetime. Process-local product cap, not a legal retention rule. */
export const MAX_SHARE_TTL_DAYS = 90;

export class VaultError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status = 400) {
    super(message);
    this.name = "VaultError";
    this.code = code;
    this.status = status;
  }
}

export function vaultErrorResponse(err: unknown): Response {
  if (err instanceof VaultError) {
    return Response.json(
      { error: err.message, code: err.code },
      { status: err.status },
    );
  }
  return Response.json({ error: "Vault request failed" }, { status: 500 });
}
