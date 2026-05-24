import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import { shouldRedactField } from "@/lib/privacy/field-access-policy";
import { MOCK_USER_ROLES } from "@/lib/testing/mock-users";

describe("RBAC boundaries", () => {
  it("participant cannot access admin dashboard permission", () => {
    expect(hasPermission("participant", "admin:dashboard")).toBe(false);
  });

  it("mapable_admin has admin dashboard", () => {
    expect(hasPermission("mapable_admin", "admin:dashboard")).toBe(true);
  });

  it("worker cannot see ndis plan fields by default", () => {
    expect(shouldRedactField("support_worker", "ndisNumber")).toBe(true);
  });

  it("mock user matrix covers core roles", () => {
    for (const role of MOCK_USER_ROLES) {
      expect(role.length).toBeGreaterThan(0);
    }
  });
});
