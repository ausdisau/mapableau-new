import { describe, expect, it } from "vitest";

import {
  mintConsentBoundToken,
  parseConsentBoundToken,
} from "@/lib/authorisation/consent-bound-tokens";
import { evaluateTokenPolicy } from "@/lib/authorisation/token-policy";

describe("token policy evaluation", () => {
  it("denies missing token", () => {
    const result = evaluateTokenPolicy(null);
    expect(result.verdict).toBe("deny");
    if (result.verdict === "deny") expect(result.reason).toBe("token_missing");
  });

  it("denies malformed token", () => {
    const result = evaluateTokenPolicy("not-a-real-token");
    expect(result.verdict).toBe("deny");
  });

  it("allows a freshly minted token", () => {
    const token = mintConsentBoundToken({
      directive: { id: "d1", effectiveUntil: null },
      entityKey: "verifier-x",
      ttlSeconds: 60,
    });
    const result = evaluateTokenPolicy(token.raw);
    expect(result.verdict).toBe("allow");
    if (result.verdict === "allow") {
      expect(result.directiveId).toBe("d1");
      expect(result.entityKey).toBe("verifier-x");
    }
  });

  it("denies a token whose expiry is in the past", () => {
    const token = mintConsentBoundToken({
      directive: {
        id: "d2",
        effectiveUntil: new Date(Date.now() - 60_000),
      },
      ttlSeconds: 60,
    });
    // parseConsentBoundToken should still parse
    expect(parseConsentBoundToken(token.raw)).not.toBeNull();
    const result = evaluateTokenPolicy(token.raw);
    expect(result.verdict).toBe("deny");
    if (result.verdict === "deny") expect(result.reason).toBe("token_expired");
  });
});
