/**
 * Envelope encryption — DESIGN INTENT ONLY.
 *
 * We do not implement crypto in this file. This module documents the shape
 * of an envelope-encryption call so callers can be adapted to a KMS-backed
 * implementation when Wave 8 encryption becomes a live capability.
 */

export interface Envelope {
  ciphertext: string;
  wrappedDataKey: string;
  keyReference: string;
  algorithm: "aes_256_gcm_envelope";
}

export function assertEnvelopeShape(envelope: unknown): asserts envelope is Envelope {
  if (!envelope || typeof envelope !== "object") {
    throw new Error("ENVELOPE_INVALID");
  }
  const e = envelope as Record<string, unknown>;
  if (typeof e.ciphertext !== "string" || !e.ciphertext) {
    throw new Error("ENVELOPE_MISSING_CIPHERTEXT");
  }
  if (typeof e.wrappedDataKey !== "string" || !e.wrappedDataKey) {
    throw new Error("ENVELOPE_MISSING_WRAPPED_KEY");
  }
  if (typeof e.keyReference !== "string" || !e.keyReference) {
    throw new Error("ENVELOPE_MISSING_KEY_REF");
  }
  if (e.algorithm !== "aes_256_gcm_envelope") {
    throw new Error("ENVELOPE_ALGORITHM_UNSUPPORTED");
  }
}
