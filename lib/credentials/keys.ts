import { createHash } from "node:crypto";

/**
 * Key material never touches the primary database. `WalletKeyReference`
 * stores only references (KMS ARN, device attestation ID, external wallet
 * URL). This helper produces stable, non-reversible references that are safe
 * to log.
 */

export function opaqueKeyRef(input: {
  scope: string;
  subject: string;
  purpose: string;
  binding: string;
}): string {
  const salt = process.env.WALLET_KEY_REF_SALT ?? "mapable-wave9";
  return createHash("sha256")
    .update(
      [salt, input.scope, input.subject, input.purpose, input.binding].join("|")
    )
    .digest("hex");
}

export function isLoggableKeyRef(ref: string): boolean {
  return /^[a-f0-9]{64}$/.test(ref);
}
