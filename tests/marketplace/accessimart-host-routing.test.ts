import { describe, expect, it } from "vitest";

import {
  DEFAULT_ACCESSIMART_HOST,
  accessiMartRewritePath,
  isAccessiMartHost,
} from "@/lib/marketplace/accessimart-host-routing";

describe("AccessiMart host routing", () => {
  it("recognises the AccessiMart subdomain from forwarded host", () => {
    expect(isAccessiMartHost("accessimart.mapable.com.au", "mapable.com.au")).toBe(
      true,
    );
  });

  it("recognises the AccessiMart subdomain from host when forwarded host is absent", () => {
    expect(isAccessiMartHost(null, `${DEFAULT_ACCESSIMART_HOST}:443`)).toBe(true);
  });

  it("does not route the main MapAble host into AccessiMart", () => {
    expect(isAccessiMartHost("mapable.com.au", "mapable.com.au")).toBe(false);
  });

  it("rewrites the AccessiMart host root to the Marketplace programme", () => {
    expect(accessiMartRewritePath("/")).toBe("/marketplace");
  });

  it("rewrites clean AccessiMart subdomain paths under /marketplace", () => {
    expect(accessiMartRewritePath("/browse")).toBe("/marketplace/browse");
  });

  it("rewrites /review on the AccessiMart host to the gated review surface", () => {
    expect(accessiMartRewritePath("/review")).toBe(
      "/marketplace/accessimart-review",
    );
  });

  it("does not double-prefix explicit Marketplace routes", () => {
    expect(accessiMartRewritePath("/marketplace")).toBeNull();
    expect(accessiMartRewritePath("/marketplace/accessimart-review")).toBeNull();
  });

  it("does not rewrite API requests or static files", () => {
    expect(accessiMartRewritePath("/api/health")).toBeNull();
    expect(accessiMartRewritePath("/images/mapable.svg")).toBeNull();
    expect(accessiMartRewritePath("/robots.txt")).toBeNull();
  });
});
