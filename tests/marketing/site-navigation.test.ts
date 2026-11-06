import { describe, expect, it } from "vitest";

import {
  buildMarketingBreadcrumbs,
  getMarketingNavGroups,
  getPublicModuleRelatedLinks,
} from "@/lib/marketing/site-navigation";

describe("site-navigation", () => {
  it("builds breadcrumbs from pathname segments", () => {
    expect(buildMarketingBreadcrumbs("/")).toEqual([]);
    expect(buildMarketingBreadcrumbs("/care")).toEqual([
      { label: "Home", href: "/" },
      { label: "Care", href: "/care" },
    ]);
    expect(buildMarketingBreadcrumbs("/guides/nsw/sydney")).toEqual([
      { label: "Home", href: "/" },
      { label: "Local Access Guides", href: "/guides" },
      { label: "NSW", href: "/guides/nsw" },
      { label: "Sydney", href: "/guides/nsw/sydney" },
    ]);
  });

  it("groups marketing nav into explore, programmes and support", () => {
    const groups = getMarketingNavGroups().map((g) => g.label);
    expect(groups).toEqual(["Explore", "Programmes", "Support"]);
    const explore = getMarketingNavGroups().find((g) => g.id === "explore");
    expect(explore?.items.some((i) => i.href === "/accessibility-map")).toBe(true);
    expect(explore?.items.some((i) => i.href === "/guides")).toBe(true);
  });

  it("returns contextual module related links", () => {
    const care = getPublicModuleRelatedLinks("/care");
    expect(care.some((l) => l.href.includes("provider-finder"))).toBe(true);
    expect(care.some((l) => l.href === "/transport")).toBe(true);
    const peer = getPublicModuleRelatedLinks("/peer");
    expect(peer.some((l) => l.href === "/about")).toBe(true);
  });
});
