import { describe, expect, it } from "vitest";

import { PanelAccessError } from "@/lib/access-control/panel-access";
import { hasPermission } from "@/lib/auth/permissions";

describe("admin panel permission boundaries", () => {
  it("participant cannot access admin dashboard permission", () => {
    expect(hasPermission("participant", "admin:dashboard")).toBe(false);
  });

  it("provider admin can read org invoices", () => {
    expect(hasPermission("provider_admin", "invoice:read:org")).toBe(true);
  });

  it("participant cannot read org invoices", () => {
    expect(hasPermission("participant", "invoice:read:org")).toBe(false);
  });

  it("plan manager has portal permission", () => {
    expect(hasPermission("plan_manager", "plan_manager:portal")).toBe(true);
  });

  it("quality read requires provider_quality or admin", () => {
    expect(hasPermission("provider_admin", "provider_quality:read")).toBe(true);
    expect(hasPermission("participant", "provider_quality:read")).toBe(false);
  });

  it("support worker cannot manage organisations", () => {
    expect(hasPermission("support_worker", "organisation:manage")).toBe(false);
  });
});

describe("PanelAccessError", () => {
  it("carries error code", () => {
    const err = new PanelAccessError("FORBIDDEN", "test");
    expect(err.code).toBe("FORBIDDEN");
  });
});
