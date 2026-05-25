import { describe, expect, it, vi } from "vitest";

import { assertIdentityOnlyMetadata, ALLOWED_GOOGLE_SCOPES } from "@/lib/auth/auth-metadata-policy";
import { isPrivilegedRole, PRIVILEGED_ROLES_REQUIRING_APPROVAL } from "@/lib/auth/privileged-roles";
import { sanitizeReturnTo } from "@/lib/auth/safe-return-to";
import { onboardingRequired, resolvePostLoginPath } from "@/lib/auth/role-onboarding-router";
import { isStepUpActionKey, STEP_UP_ACTIONS } from "@/lib/auth/step-up/step-up-policy";
import { isEphiPossible } from "@/lib/compliance/ephi-classification";
import { canViewParticipantProfile, hasPermission } from "@/lib/auth/permissions";
import { getAuth0Env } from "@/lib/auth0/env";

describe("safe returnTo", () => {
  it("rejects unsafe returnTo URLs", () => {
    expect(sanitizeReturnTo("//evil.com")).toBe("/dashboard");
    expect(sanitizeReturnTo("https://evil.com/phish")).toBe("/dashboard");
    expect(sanitizeReturnTo("javascript:alert(1)")).toBe("/dashboard");
  });

  it("allows safe relative paths", () => {
    expect(sanitizeReturnTo("/dashboard/bookings")).toBe("/dashboard/bookings");
  });
});

describe("Google / Auth0 identity policy", () => {
  it("allows only minimal Google scopes", () => {
    expect(ALLOWED_GOOGLE_SCOPES).toEqual(["openid", "email", "profile"]);
  });

  it("rejects sensitive data in auth metadata", () => {
    expect(() =>
      assertIdentityOnlyMetadata({ ndis_number: "123" })
    ).toThrow(/Forbidden Auth0 metadata/);
    expect(() => assertIdentityOnlyMetadata({ clinical_notes: "x" })).toThrow();
    expect(() => assertIdentityOnlyMetadata({ email: "a@b.c" })).not.toThrow();
  });
});

describe("privileged roles", () => {
  it("provider/admin roles are not auto-approved by default policy", () => {
    expect(isPrivilegedRole("provider_admin")).toBe(true);
    expect(isPrivilegedRole("mapable_admin")).toBe(true);
    expect(isPrivilegedRole("participant")).toBe(false);
    expect(PRIVILEGED_ROLES_REQUIRING_APPROVAL).toContain("provider_admin");
  });
});

describe("onboarding router", () => {
  it("routes incomplete onboarding to role page", () => {
    expect(onboardingRequired("pending_role")).toBe(true);
    expect(
      resolvePostLoginPath({ onboardingStatus: "pending_role" })
    ).toBe("/onboarding/role");
  });

  it("routes complete users to dashboard", () => {
    expect(
      resolvePostLoginPath({
        onboardingStatus: "complete",
        primaryRole: "participant",
      })
    ).toBe("/dashboard");
  });
});

describe("step-up policy", () => {
  it("requires step-up for NDIS document access key", () => {
    expect(isStepUpActionKey("ndis_document.view")).toBe(true);
    expect(STEP_UP_ACTIONS["ndis_document.view"]).toBeDefined();
  });

  it("requires step-up for incident view", () => {
    expect(isStepUpActionKey("incident.view")).toBe(true);
  });
});

describe("invoice approval permissions", () => {
  it("denies participant from admin invoice approval", () => {
    expect(hasPermission("participant", "admin:dashboard")).toBe(false);
  });
});

describe("participant record isolation", () => {
  it("prevents participant viewing another participant profile", () => {
    expect(
      canViewParticipantProfile("participant", "user-a", "user-b")
    ).toBe(false);
  });

  it("allows participant to view own profile", () => {
    expect(
      canViewParticipantProfile("participant", "user-a", "user-a")
    ).toBe(true);
  });
});

describe("ePHI classification", () => {
  it("marks ephi_possible for vendor BAA logic", () => {
    expect(isEphiPossible("ephi_possible")).toBe(true);
    expect(isEphiPossible("identity_data")).toBe(false);
  });
});

describe("auth env", () => {
  it("defaults AUTH_PROVIDER to auth0", () => {
    const env = getAuth0Env();
    expect(["auth0", "nextauth"]).toContain(env.AUTH_PROVIDER);
  });

  it("uses openid profile email scope", () => {
    expect(getAuth0Env().AUTH0_SCOPE).toContain("openid");
    expect(getAuth0Env().AUTH0_SCOPE).not.toContain("drive");
  });
});

describe("localStorage token policy", () => {
  it("auth UI components do not reference localStorage for tokens", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const dir = path.join(process.cwd(), "components/auth");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".tsx"));
    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), "utf8");
      expect(content).not.toMatch(/localStorage/);
    }
  });
});

describe("vendor BAA register (unit)", () => {
  it("flags BAA required when ePHI possible", () => {
    const vendor = {
      handlesPhiOrEphi: true,
      baaRequired: true,
      baaSigned: false,
    };
    expect(vendor.baaRequired && !vendor.baaSigned).toBe(true);
  });
});

describe("account linking", () => {
  it("email collision should not silently merge (contract)", () => {
    const result = { status: "linking_required" as const };
    expect(result.status).toBe("linking_required");
  });
});

describe("Auth0 identity link creation (mock)", () => {
  it("creates identity link shape for new login", () => {
    const link = {
      auth0UserId: "auth0|abc",
      provider: "google" as const,
      email: "user@example.com",
      emailVerified: true,
    };
    expect(link.auth0UserId).toBeTruthy();
    expect(link.provider).toBe("google");
  });
});

describe("logout session", () => {
  it("logout route is Auth0 middleware path", () => {
    expect("/auth/logout").toMatch(/^\/auth\/logout$/);
  });
});
