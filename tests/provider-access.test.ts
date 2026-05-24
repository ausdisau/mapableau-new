import { describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";
import {
  isProviderPortalRole,
  resolveProviderAccess,
} from "@/lib/provider-onboarding/provider-access";

vi.mock("@/lib/api/phase3-scope", () => ({
  getUserOrganisationIds: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organisation: {
      findUnique: vi.fn(),
    },
  },
}));

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { prisma } from "@/lib/prisma";

const baseUser: CurrentUser = {
  id: "user-1",
  email: "provider@mapable.test",
  name: "Provider Admin",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "provider_admin",
  roles: ["provider_admin"],
};

describe("isProviderPortalRole", () => {
  it("returns true for provider and transport roles", () => {
    expect(isProviderPortalRole("provider_admin")).toBe(true);
    expect(isProviderPortalRole("transport_operator")).toBe(true);
    expect(isProviderPortalRole("participant")).toBe(false);
  });
});

describe("resolveProviderAccess", () => {
  it("returns first organisation for provider without param", async () => {
    vi.mocked(getUserOrganisationIds).mockResolvedValue(["org-a", "org-b"]);
    const access = await resolveProviderAccess(baseUser);
    expect(access).toEqual({
      organisationId: "org-a",
      viewAsAdmin: false,
    });
  });

  it("denies unknown organisation for non-admin", async () => {
    vi.mocked(getUserOrganisationIds).mockResolvedValue(["org-a"]);
    const access = await resolveProviderAccess(baseUser, "org-other");
    expect(access).toBeNull();
  });

  it("allows admin to view requested organisation", async () => {
    vi.mocked(prisma.organisation.findUnique).mockResolvedValue({
      id: "org-x",
    } as never);
    const admin: CurrentUser = {
      ...baseUser,
      id: "admin-1",
      primaryRole: "mapable_admin",
      roles: ["mapable_admin"],
    };
    const access = await resolveProviderAccess(admin, "org-x");
    expect(access).toEqual({
      organisationId: "org-x",
      viewAsAdmin: true,
    });
  });
});
