import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  profileCreateSchema,
  profileRoleAssignSchema,
  consentGrantCreateSchema,
  featureFlagUpsertSchema,
} from "@/lib/validation/core-schemas";
import {
  roleRequiresApproval,
  mapPromptRoleToUserRole,
  AUTO_APPROVED_ROLES,
} from "@/types/roles";
import { platformScopeToLegacyScope } from "@/lib/db/platform-consent-service";

describe("P0 core validation schemas", () => {
  it("accepts valid profile create input", () => {
    const result = profileCreateSchema.safeParse({
      email: "a@example.com",
      name: "Alex",
    });
    expect(result.success).toBe(true);
  });

  it("accepts profile role assign with pending status", () => {
    const result = profileRoleAssignSchema.safeParse({
      profileId: "prof-1",
      role: "participant",
      status: "pending",
    });
    expect(result.success).toBe(true);
  });

  it("accepts consent grant create", () => {
    const result = consentGrantCreateSchema.safeParse({
      subjectProfileId: "p1",
      scope: "view_bookings",
      purpose: "Coordinate supports",
      grantedToOrganisationId: "org-1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid feature flag keys", () => {
    const result = featureFlagUpsertSchema.safeParse({
      key: "Bad-Key",
      enabled: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("P0 role policy", () => {
  it("auto-approves participant roles", () => {
    expect(AUTO_APPROVED_ROLES).toContain("participant");
    expect(roleRequiresApproval("participant")).toBe(false);
  });

  it("requires approval for provider admin", () => {
    expect(roleRequiresApproval("provider_admin")).toBe(true);
  });

  it("maps nominee_or_family to family_member", () => {
    expect(mapPromptRoleToUserRole("nominee_or_family")).toBe("family_member");
  });
});

describe("P0 consent scope mapping", () => {
  it("maps view_bookings to legacy booking.read", () => {
    expect(platformScopeToLegacyScope("view_bookings")).toBe("booking.read");
  });

  it("returns null for scopes without legacy mapping", () => {
    expect(platformScopeToLegacyScope("view_service_logs")).toBeNull();
  });
});

describe("P0 spine services (mocked db)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("evaluateFeatureFlag returns false when flag missing", async () => {
    vi.doMock("@/lib/db/db-client", () => ({
      getDbClient: () => ({
        featureFlag: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
        featureFlagEvent: { create: vi.fn() },
      }),
    }));
    const { evaluateFeatureFlag } = await import(
      "@/lib/db/feature-flag-service"
    );
    const result = await evaluateFeatureFlag("telehealth_mvp", {
      profileId: "u1",
      role: "participant",
    });
    expect(result).toBe(false);
  });
});
