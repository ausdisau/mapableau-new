import { describe, expect, it } from "vitest";

import { resolveModuleHref } from "@/lib/platform/module-links";
import { getModuleByKey, modules } from "@/lib/platform/modules-catalog";
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
    expect(PORTAL_MODULES.care.logoHref).toBe("/care");
  });

  it("keeps unique product module keys", () => {
    const keys = PRODUCT_MODULES.map((m) => m.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("carousel hrefs point at live routes or coming-soon stubs", () => {
    for (const mod of modules) {
      const href = resolveModuleHref(mod);
      if (mod.availability === "coming_soon") {
        expect(href).toBe(`/core/modules/${mod.key}`);
        continue;
      }
      expect(href.startsWith("/")).toBe(true);
      expect(href).not.toMatch(/^\/(transport|employment|foods|moves|marketplace|kids)$/);
    }
  });

  it("maps transport and jobs catalog keys to product routes", () => {
    expect(resolveModuleHref(getModuleByKey("transport")!)).toBe("/driver/trips");
    expect(resolveModuleHref(getModuleByKey("jobs")!)).toBe("/employer/jobs");
  });
});
