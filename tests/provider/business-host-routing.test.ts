import { describe, expect, it } from "vitest";

import {
  DEFAULT_BUSINESS_HOST,
  businessRewritePath,
  businessStripProviderPrefix,
  isBusinessHost,
  providerCenterPath,
} from "@/lib/provider/business-host-routing";

describe("Provider Center business host routing", () => {
  it("recognises the business subdomain from forwarded host", () => {
    expect(isBusinessHost("business.mapable.com.au", "mapable.com.au")).toBe(
      true,
    );
  });

  it("recognises the business subdomain from host when forwarded host is absent", () => {
    expect(isBusinessHost(null, `${DEFAULT_BUSINESS_HOST}:443`)).toBe(true);
  });

  it("does not route the main MapAble host into Provider Center", () => {
    expect(isBusinessHost("mapable.com.au", "mapable.com.au")).toBe(false);
    expect(isBusinessHost("labs.mapable.com.au", "labs.mapable.com.au")).toBe(
      false,
    );
  });

  it("rewrites the business host root to the provider console", () => {
    expect(businessRewritePath("/")).toBe("/provider");
  });

  it("rewrites clean business subdomain paths into /provider routes", () => {
    expect(businessRewritePath("/care")).toBe("/provider/care");
    expect(businessRewritePath("/billing")).toBe("/provider/billing");
    expect(businessRewritePath("/workers")).toBe("/provider/workers");
    expect(businessRewritePath("/onboarding")).toBe("/provider/onboarding");
  });

  it("does not double-prefix explicit provider routes", () => {
    expect(businessRewritePath("/provider")).toBeNull();
    expect(businessRewritePath("/provider/care")).toBeNull();
  });

  it("does not rewrite API requests or static files", () => {
    expect(businessRewritePath("/api/health")).toBeNull();
    expect(businessRewritePath("/images/mapable.svg")).toBeNull();
    expect(businessRewritePath("/robots.txt")).toBeNull();
  });

  it("strips /provider for canonical clean URLs on the business host", () => {
    expect(businessStripProviderPrefix("/provider")).toBe("/");
    expect(businessStripProviderPrefix("/provider/care")).toBe("/care");
    expect(businessStripProviderPrefix("/care")).toBeNull();
  });

  it("builds host-aware nav paths", () => {
    expect(providerCenterPath("/", true)).toBe("/");
    expect(providerCenterPath("/care", true)).toBe("/care");
    expect(providerCenterPath("/", false)).toBe("/provider");
    expect(providerCenterPath("/care", false)).toBe("/provider/care");
  });
});
