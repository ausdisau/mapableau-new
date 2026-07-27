import { describe, expect, it } from "vitest";

import { verifyTwoFactorToken } from "@/lib/auth/two-factor-token";

describe("Wave 5 step-up MFA binding", () => {
  it("rejects missing MFA token as unbound", () => {
    expect(verifyTwoFactorToken("", "step-up-mfa")).toBeNull();
  });

  it("rejects client-forged MFA tokens (not a valid HMAC assertion)", () => {
    expect(
      verifyTwoFactorToken(
        "forged-not-a-real-hmac-token-value-xxxxxx",
        "step-up-mfa",
      ),
    ).toBeNull();
  });
});
