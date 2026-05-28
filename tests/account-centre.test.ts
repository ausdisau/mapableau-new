import { describe, expect, it } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";
import {
  getAccountCentrePersona,
  userHasPermission,
} from "@/lib/auth/account-access";
import { hasPermission } from "@/lib/auth/permissions";
import {
  getAccountCentreSections,
} from "@/lib/core-ui/account-centre-sections";

function mockUser(
  partial: Partial<CurrentUser> & Pick<CurrentUser, "primaryRole" | "roles">
): CurrentUser {
  return {
    id: "user-1",
    email: "test@mapable.test",
    name: "Test User",
    phone: null,
    timezone: "Australia/Sydney",
    locale: "en-AU",
    ...partial,
  };
}

describe("userHasPermission", () => {
  it("grants worker permission when secondary role is support_worker", () => {
    const user = mockUser({
      primaryRole: "participant",
      roles: ["participant", "support_worker"],
    });
    expect(hasPermission("participant", "care:shift:work")).toBe(false);
    expect(userHasPermission(user, "care:shift:work")).toBe(true);
  });

  it("grants account read for provider admin", () => {
    const user = mockUser({
      primaryRole: "provider_admin",
      roles: ["provider_admin"],
    });
    expect(userHasPermission(user, "account:read:self")).toBe(true);
  });
});

describe("getAccountCentrePersona", () => {
  it("returns provider for provider_admin", () => {
    const user = mockUser({
      primaryRole: "provider_admin",
      roles: ["provider_admin"],
    });
    expect(getAccountCentrePersona(user)).toBe("provider");
  });

  it("returns worker for driver", () => {
    const user = mockUser({
      primaryRole: "driver",
      roles: ["driver"],
    });
    expect(getAccountCentrePersona(user)).toBe("worker");
  });

  it("returns participant for participant role", () => {
    const user = mockUser({
      primaryRole: "participant",
      roles: ["participant"],
    });
    expect(getAccountCentrePersona(user)).toBe("participant");
  });
});

describe("getAccountCentreSections", () => {
  it("shows billing and consent for participant", () => {
    const user = mockUser({
      primaryRole: "participant",
      roles: ["participant"],
    });
    const sections = getAccountCentreSections(user);
    expect(sections.billing).toBe(true);
    expect(sections.consent).toBe(true);
    expect(sections.organisation).toBe(false);
  });

  it("shows organisation for provider", () => {
    const user = mockUser({
      primaryRole: "provider_admin",
      roles: ["provider_admin"],
    });
    const sections = getAccountCentreSections(user);
    expect(sections.organisation).toBe(true);
    expect(sections.consent).toBe(false);
    expect(sections.portals).toBe(true);
  });

  it("shows worker profile section for support_worker", () => {
    const user = mockUser({
      primaryRole: "support_worker",
      roles: ["support_worker"],
    });
    const sections = getAccountCentreSections(user);
    expect(sections.workerProfile).toBe(true);
    expect(sections.portals).toBe(true);
    expect(sections.billing).toBe(false);
  });
});
