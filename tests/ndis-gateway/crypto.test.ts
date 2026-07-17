import { afterEach, describe, expect, it, vi } from "vitest";

import {
  NdisCryptoError,
  decryptNdisNumber,
  decryptNdisSensitiveString,
  encryptNdisNumber,
  encryptNdisSensitiveJson,
  decryptNdisSensitiveJson,
  encryptNdisSensitiveString,
  hashNdisPayload,
  maskNdisNumber,
  redactNdisSensitiveFields,
} from "@/lib/crypto/ndis";

afterEach(() => {
  vi.unstubAllEnvs();
});

function stubDevCrypto() {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("NDIS_ALLOW_INSECURE_DEV_KEY", "true");
  vi.stubEnv("NDIS_ENCRYPTION_ACTIVE_KEY_VERSION", "v1");
}

describe("NDIS encryption Wave 2", () => {
  it("round-trips envelope encryption", () => {
    stubDevCrypto();
    const ciphertext = encryptNdisSensitiveString("430000000", "aad-test");
    expect(ciphertext.startsWith("{")).toBe(true);
    expect(ciphertext).not.toContain("430000000");
    expect(decryptNdisSensitiveString(ciphertext, "aad-test")).toBe("430000000");
  });

  it("produces different ciphertext for identical plaintext", () => {
    stubDevCrypto();
    const a = encryptNdisSensitiveString("430000000");
    const b = encryptNdisSensitiveString("430000000");
    expect(a).not.toBe(b);
  });

  it("fails closed in production without dedicated key", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NDIS_ALLOW_INSECURE_DEV_KEY", "true");
    vi.stubEnv("NDIS_ENCRYPTION_ACTIVE_KEY_VERSION", "v1");
    vi.stubEnv("NDIS_ENCRYPTION_KEY_V1", "");
    vi.stubEnv("NDIS_ENCRYPTION_KEY", "");
    expect(() => encryptNdisSensitiveString("430000000")).toThrow(NdisCryptoError);
    try {
      encryptNdisSensitiveString("430000000");
    } catch (err) {
      expect((err as NdisCryptoError).code).toBe("NDIS_ENCRYPTION_KEY_MISSING");
    }
  });

  it("rejects wrong key version", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NDIS_ENCRYPTION_KEY_V1", "key-one-material");
    vi.stubEnv("NDIS_ENCRYPTION_ACTIVE_KEY_VERSION", "v1");
    vi.stubEnv("NDIS_ALLOW_INSECURE_DEV_KEY", "");
    const ciphertext = encryptNdisSensitiveString("430000000");
    const envelope = JSON.parse(ciphertext) as { keyVersion: string };
    envelope.keyVersion = "v9";
    expect(() => decryptNdisSensitiveString(JSON.stringify(envelope))).toThrow(
      NdisCryptoError
    );
  });

  it("rejects malformed envelope", () => {
    stubDevCrypto();
    expect(() => decryptNdisSensitiveString("{not-json")).toThrow(NdisCryptoError);
    expect(() => decryptNdisSensitiveString("{}")).toThrow(NdisCryptoError);
  });

  it("supports legacy env key alias", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NDIS_ENCRYPTION_KEY", "legacy-key-material");
    vi.stubEnv("NDIS_ENCRYPTION_ACTIVE_KEY_VERSION", "v1");
    vi.stubEnv("NDIS_ENCRYPTION_KEY_V1", "");
    vi.stubEnv("NDIS_ALLOW_INSECURE_DEV_KEY", "");
    const envCipher = encryptNdisSensitiveString("430000001");
    expect(decryptNdisSensitiveString(envCipher)).toBe("430000001");
    expect(decryptNdisNumber("not:valid")).toBeNull();
  });

  it("auth-tag tampering fails", () => {
    stubDevCrypto();
    const ciphertext = encryptNdisSensitiveString("430000000");
    const envelope = JSON.parse(ciphertext) as { authTag: string };
    envelope.authTag = Buffer.from("tampered-tag-12").toString("base64");
    expect(() => decryptNdisSensitiveString(JSON.stringify(envelope))).toThrow(
      NdisCryptoError
    );
  });

  it("encrypts JSON payloads", () => {
    stubDevCrypto();
    const cipher = encryptNdisSensitiveJson({ ndisNumber: "430000000" });
    expect(decryptNdisSensitiveJson<{ ndisNumber: string }>(cipher)).toEqual({
      ndisNumber: "430000000",
    });
  });

  it("masks and redacts sensitive fields", () => {
    expect(maskNdisNumber("430000123")).toBe("****0123");
    const redacted = redactNdisSensitiveFields({
      participant: { ndisNumber: "430000123", name: "Alex" },
      nested: [{ access_token: "secret", quantity: 2 }],
      note: "participant 430000123 attended",
    });
    expect(redacted.participant.ndisNumber).toBe("****0123");
    expect(redacted.nested[0].access_token).toBe("[REDACTED]");
    expect(redacted.note).toContain("[REDACTED_NDIS]");
    expect(redacted.participant.name).toBe("Alex");
  });

  it("hashes payloads deterministically", () => {
    expect(hashNdisPayload('{"a":1}')).toBe(hashNdisPayload('{"a":1}'));
  });

  it("compatibility encryptNdisNumber writes envelope", () => {
    stubDevCrypto();
    const enc = encryptNdisNumber("430000000");
    expect(enc.startsWith("{")).toBe(true);
    expect(decryptNdisNumber(enc)).toBe("430000000");
  });
});
