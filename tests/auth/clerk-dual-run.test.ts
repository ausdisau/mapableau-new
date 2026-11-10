import { describe, expect, it } from "vitest";

import { shouldTrustClerkSessionAsAuth } from "@/lib/auth/clerk-dual-run";

describe("shouldTrustClerkSessionAsAuth", () => {
  it("rejects when Clerk publishable key is missing", () => {
    expect(
      shouldTrustClerkSessionAsAuth({
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
        TWILIO_2FA_ENABLED: "false",
      }),
    ).toBe(false);
  });

  it("rejects Clerk trust while Twilio Verify MFA is enabled", () => {
    expect(
      shouldTrustClerkSessionAsAuth({
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
        TWILIO_2FA_ENABLED: "true",
      }),
    ).toBe(false);
  });

  it("allows Clerk trust when keys exist and Twilio MFA is off", () => {
    expect(
      shouldTrustClerkSessionAsAuth({
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
        TWILIO_2FA_ENABLED: "false",
      }),
    ).toBe(true);
  });
});
