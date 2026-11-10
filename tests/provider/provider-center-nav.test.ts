import { describe, expect, it } from "vitest";

import {
  getProviderCenterHref,
  getProviderCenterNavLinks,
} from "@/lib/platform/core-ui/provider-center-nav";
import { normalizeProviderCenterPathname } from "@/lib/platform/core-ui/provider-path";

describe("Provider Center nav", () => {
  it("emits clean hrefs on the business host", () => {
    const links = getProviderCenterNavLinks(true);
    expect(links[0]).toMatchObject({ href: "/", label: "Home", match: "exact" });
    expect(links.some((l) => l.href === "/care" && l.label === "Care")).toBe(
      true,
    );
    expect(links.some((l) => l.href === "/billing" && l.label === "Money")).toBe(
      true,
    );
  });

  it("emits /provider-prefixed hrefs on apex", () => {
    const links = getProviderCenterNavLinks(false);
    expect(links[0]).toMatchObject({
      href: "/provider",
      label: "Home",
      match: "exact",
    });
    expect(
      links.some((l) => l.href === "/provider/care" && l.label === "Care"),
    ).toBe(true);
  });

  it("builds deep links for both hosts", () => {
    expect(getProviderCenterHref("/onboarding", true)).toBe("/onboarding");
    expect(getProviderCenterHref("/onboarding", false)).toBe(
      "/provider/onboarding",
    );
  });

  it("normalizes rewritten provider pathnames for active nav matching", () => {
    expect(normalizeProviderCenterPathname("/provider")).toBe("/");
    expect(normalizeProviderCenterPathname("/provider/care")).toBe("/care");
    expect(normalizeProviderCenterPathname("/care")).toBe("/care");
  });
});
