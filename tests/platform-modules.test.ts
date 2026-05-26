import { describe, expect, it } from "vitest";

import { PORTAL_MODULES, PROVIDER_NAV_LINKS } from "@/lib/platform/portal-nav";
import { getProductModule, modulesByShell, PRODUCT_MODULES } from "@/lib/platform/modules";

describe("platform modules", () => {
  it("registers access and peers with distinct shells", () => {
    expect(getProductModule("access")?.shell).toBe("public");
    expect(getProductModule("peers")?.shell).toBe("core");
  });

  it("groups portal modules", () => {
    const portalKeys = modulesByShell("portal").map((m) => m.key);
    expect(portalKeys).toContain("care");
    expect(portalKeys).toContain("provider");
    expect(portalKeys).toContain("worker");
  });

  it("exposes portal nav for each role console", () => {
    expect(PORTAL_MODULES.care.links.length).toBeGreaterThan(0);
    expect(PORTAL_MODULES.provider.links).toEqual(PROVIDER_NAV_LINKS);
  });

  it("keeps unique product module keys", () => {
    const keys = PRODUCT_MODULES.map((m) => m.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
