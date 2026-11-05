import { describe, expect, it } from "vitest";

import {
  coverageCareRewritePath,
  isCoverageCareHost,
} from "@/lib/coverage-care/host-routing";

describe("Coverage Care host routing", () => {
  it("detects the proposed Coverage Care hostname", () => {
    expect(
      isCoverageCareHost(null, "coveragecare.mapable.com.au"),
    ).toBe(true);
    expect(isCoverageCareHost(null, "mapable.com.au")).toBe(false);
    expect(isCoverageCareHost(null, "peer.mapable.com.au")).toBe(false);
  });

  it("rewrites public paths and leaves api/robots/sitemap alone", () => {
    expect(coverageCareRewritePath("/")).toBe("/coverage-care");
    expect(coverageCareRewritePath("/services")).toBe(
      "/coverage-care/services",
    );
    expect(coverageCareRewritePath("/coverage-care")).toBeNull();
    expect(coverageCareRewritePath("/api/coverage-care/services")).toBeNull();
    expect(coverageCareRewritePath("/robots.txt")).toBeNull();
    expect(coverageCareRewritePath("/sitemap.xml")).toBeNull();
    expect(coverageCareRewritePath("/logo.svg")).toBeNull();
  });
});
