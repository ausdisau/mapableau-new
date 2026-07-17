import { createHash } from "node:crypto";

/**
 * Backup manifests describe the *shape* of a wallet snapshot, not its
 * contents. Real backup payloads never leave the participant device without
 * their explicit action. This module produces the deterministic
 * fingerprint used to detect drift between local wallet state and the
 * server-side recovery-policy record.
 */

export interface WalletBackupManifest {
  walletId: string;
  keyReferenceIds: string[];
  recoveryPolicyId: string | null;
  createdAt: string;
}

export function fingerprintManifest(manifest: WalletBackupManifest): string {
  const stable = {
    walletId: manifest.walletId,
    keyReferenceIds: [...manifest.keyReferenceIds].sort(),
    recoveryPolicyId: manifest.recoveryPolicyId ?? null,
    createdAt: manifest.createdAt,
  };
  return createHash("sha256").update(JSON.stringify(stable)).digest("hex");
}
