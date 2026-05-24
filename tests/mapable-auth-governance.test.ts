import { describe, expect, it } from "vitest";

import { createPendingLinkToken, verifyPendingLinkToken } from "@/lib/auth/link-token";
import { getPostAuthRedirectPath } from "@/lib/auth/role-router";

describe("getPostAuthRedirectPath", () => {
  it("sends new participants to onboarding dashboard", () => {
    expect(
      getPostAuthRedirectPath({
        primaryRole: "participant",
        onboardingStatus: "not_started",
      }),
    ).toBe("/dashboard?onboarding=1");
  });

  it("sends provider admins to provider onboarding when incomplete", () => {
    expect(
      getPostAuthRedirectPath({
        primaryRole: "provider_admin",
        onboardingStatus: "in_progress",
      }),
    ).toBe("/provider/onboarding");
  });

  it("allows safe internal redirect paths", () => {
    expect(
      getPostAuthRedirectPath({
        primaryRole: "participant",
        onboardingStatus: "completed",
        requestedPath: "/dashboard/bookings",
      }),
    ).toBe("/dashboard/bookings");
  });

  it("rejects unsafe redirect paths", () => {
    expect(
      getPostAuthRedirectPath({
        primaryRole: "participant",
        onboardingStatus: "completed",
        requestedPath: "https://evil.example",
      }),
    ).toBe("/dashboard");
  });
});

describe("pending link token", () => {
  it("round-trips provider link payload", () => {
    process.env.NEXTAUTH_SECRET = "test-secret-for-link-token";
    const token = createPendingLinkToken({
      provider: "google",
      providerSubject: "sub-123",
      email: "user@example.com",
      name: "Test User",
    });
    const payload = verifyPendingLinkToken(token);
    expect(payload?.email).toBe("user@example.com");
    expect(payload?.providerSubject).toBe("sub-123");
  });
});
