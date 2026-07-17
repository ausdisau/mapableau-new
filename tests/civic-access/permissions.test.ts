import { describe, expect, it } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";
import { hasCivicCapability } from "@/lib/civic-access/permissions";

function user(
  primaryRole: CurrentUser["primaryRole"],
  roles: CurrentUser["roles"] = [primaryRole]
): CurrentUser {
  return {
    id: "user_1",
    email: "test@example.com",
    name: "Test",
    phone: null,
    timezone: "Australia/Sydney",
    locale: "en-AU",
    primaryRole,
    roles,
  };
}

describe("civic permissions", () => {
  it("allows admins all Wave 1 capabilities", () => {
    const admin = user("mapable_admin");
    expect(hasCivicCapability(admin, "assets:read")).toBe(true);
    expect(hasCivicCapability(admin, "assets:write")).toBe(true);
    expect(hasCivicCapability(admin, "pilot:seed")).toBe(true);
  });

  it("allows operators to read/write registry but not participants", () => {
    const operator = user("transport_operator");
    expect(hasCivicCapability(operator, "assets:read")).toBe(true);
    expect(hasCivicCapability(operator, "assets:write")).toBe(true);

    const participant = user("participant");
    expect(hasCivicCapability(participant, "assets:read")).toBe(false);
    expect(hasCivicCapability(participant, "pilot:seed")).toBe(false);
  });
});
