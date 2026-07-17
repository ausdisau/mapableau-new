import { describe, expect, it } from "vitest";

import {
  mintConsentBoundToken,
  parseConsentBoundToken,
} from "@/lib/authorisation/consent-bound-tokens";

describe("consent-bound tokens", () => {
  it("mints and parses back the same directive id", () => {
    const token = mintConsentBoundToken({
      directive: { id: "dir-1", effectiveUntil: null },
      entityKey: "verifier-a",
      ttlSeconds: 60,
    });
    const parsed = parseConsentBoundToken(token.raw);
    expect(parsed).not.toBeNull();
    expect(parsed!.directiveId).toBe("dir-1");
    expect(parsed!.entityKey).toBe("verifier-a");
  });

  it("returns null for random strings", () => {
    expect(parseConsentBoundToken("not-a-token")).toBeNull();
  });

  it("returns null when the signature is tampered", () => {
    const token = mintConsentBoundToken({
      directive: { id: "dir-1", effectiveUntil: null },
    });
    const [body, sig] = token.raw.slice(4).split(".");
    const tampered = "cbt_" + body + "." + sig.split("").reverse().join("");
    expect(parseConsentBoundToken(tampered)).toBeNull();
  });

  it("caps expiry at the directive's effectiveUntil", () => {
    const earlyExpiry = new Date(Date.now() + 5_000);
    const token = mintConsentBoundToken({
      directive: { id: "dir-1", effectiveUntil: earlyExpiry },
      ttlSeconds: 3600,
    });
    expect(new Date(token.expiresAt).getTime()).toBeLessThanOrEqual(
      earlyExpiry.getTime()
    );
  });

  it("uses a unique nonce per token", () => {
    const a = mintConsentBoundToken({
      directive: { id: "d1", effectiveUntil: null },
    });
    const b = mintConsentBoundToken({
      directive: { id: "d1", effectiveUntil: null },
    });
    expect(a.nonce).not.toBe(b.nonce);
    expect(a.raw).not.toBe(b.raw);
  });
});
