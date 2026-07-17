import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import {
  assertTenantMatch,
  capabilityForPermission,
  permissionForCapability,
  QS_ROLE_PRESETS,
  userHasQsCapability,
} from "@/lib/quality-safeguards/capabilities";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    qsCapabilityGrant: {
      findFirst: vi.fn(),
    },
  },
}));

function user(role: CurrentUser["primaryRole"], id = "user-1"): CurrentUser {
  return {
    id,
    name: "Test",
    email: "test@example.com",
    phone: null,
    timezone: "Australia/Sydney",
    locale: "en-AU",
    primaryRole: role,
    roles: [role],
  };
}

describe("quality-safeguards capabilities", () => {
  beforeEach(() => {
    vi.mocked(prisma.qsCapabilityGrant.findFirst).mockReset();
  });

  it("maps capability codes to permissions", () => {
    expect(permissionForCapability("qs_ops_read")).toBe("qs:ops:read");
    expect(capabilityForPermission("qs:signal:triage")).toBe("qs_signal_triage");
  });

  it("allows mapable_admin without grant lookup", async () => {
    await expect(
      userHasQsCapability(user("mapable_admin"), "incident_close")
    ).resolves.toBe(true);
    expect(prisma.qsCapabilityGrant.findFirst).not.toHaveBeenCalled();
  });

  it("allows provider_admin for role-granted qs:ops:read", async () => {
    await expect(
      userHasQsCapability(user("provider_admin"), "qs_ops_read")
    ).resolves.toBe(true);
  });

  it("falls back to org grant for support_worker", async () => {
    vi.mocked(prisma.qsCapabilityGrant.findFirst).mockResolvedValue({
      id: "grant-1",
    } as never);
    await expect(
      userHasQsCapability(user("support_worker"), "qs_signal_triage", "org-1")
    ).resolves.toBe(true);
  });

  it("denies when role and grant missing", async () => {
    vi.mocked(prisma.qsCapabilityGrant.findFirst).mockResolvedValue(null);
    await expect(
      userHasQsCapability(user("participant"), "audit_manage")
    ).resolves.toBe(false);
  });

  it("enforces tenant match when both ids present", () => {
    expect(assertTenantMatch("org-a", "org-a")).toBe(true);
    expect(assertTenantMatch("org-a", "org-b")).toBe(false);
  });

  it("defines safeguarding_lead preset with reportability confirm", () => {
    expect(QS_ROLE_PRESETS.safeguarding_lead).toContain(
      "incident_confirm_reportability"
    );
  });
});
