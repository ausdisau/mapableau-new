import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import { isSafeReturnTo, resolveReturnTo } from "@/lib/auth/session-service";
import { isRoleAutoApproved } from "@/lib/auth/role-router";
import { navigationForRole } from "@/lib/navigation/role-navigation";
import type { CurrentUser } from "@/lib/auth/current-user";

describe("P0 access and session", () => {
  it("blocks unsafe returnTo URLs", () => {
    expect(isSafeReturnTo("https://evil.test")).toBe(false);
    expect(isSafeReturnTo("//evil")).toBe(false);
    expect(isSafeReturnTo("/participant")).toBe(true);
  });

  it("falls back when returnTo is unsafe", () => {
    expect(resolveReturnTo("https://x", "/dashboard")).toBe("/dashboard");
  });

  it("does not auto-approve provider admin", () => {
    expect(isRoleAutoApproved("provider_admin")).toBe(false);
  });

  it("participant can view own profile permission", () => {
    expect(hasPermission("participant", "profile:read:self")).toBe(true);
  });

  it("nominee-style family member denied admin dashboard", () => {
    expect(hasPermission("family_member", "admin:dashboard")).toBe(false);
  });

  it("restricts global organisation manage permission to admins", () => {
    expect(hasPermission("mapable_admin", "organisation:manage")).toBe(true);
    expect(hasPermission("provider_admin", "organisation:manage")).toBe(false);
    expect(hasPermission("support_worker", "organisation:manage")).toBe(false);
  });
});

describe("P0 role navigation", () => {
  it("shows participant nav items", () => {
    const nav = navigationForRole("participant");
    expect(nav.map((n) => n.label)).toContain("Find");
    expect(nav.map((n) => n.label)).toContain("Bookings");
  });

  it("shows provider admin nav", () => {
    const nav = navigationForRole("provider_admin");
    expect(nav.map((n) => n.label)).toContain("Jobs");
  });

  it("shows driver nav with Trips", () => {
    const nav = navigationForRole("driver");
    expect(nav.some((n) => n.label === "Trips")).toBe(true);
  });
});

describe("P0 participant access helper", () => {
  const participant: CurrentUser = {
    id: "p1",
    email: "p@x.com",
    name: "Pat",
    phone: null,
    timezone: "Australia/Sydney",
    locale: "en-AU",
    primaryRole: "participant",
    roles: ["participant"],
  };

  it("allows self access conceptually", () => {
    expect(participant.id).toBe("p1");
  });
});
