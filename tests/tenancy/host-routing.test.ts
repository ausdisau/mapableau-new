import { afterEach, describe, expect, it } from "vitest";

import {
  coverageCareRewritePath,
  isCoverageCareHost,
} from "@/lib/coverage-care/host-routing";

describe("Coverage Care host routing (tenancy)", () => {
  afterEach(() => {
    delete process.env.MAPABLE_COVERAGE_CARE_ENABLED;
  });

  it("detects the proposed Coverage Care hostname", () => {
    expect(isCoverageCareHost(null, "coveragecare.mapable.com.au")).toBe(true);
    expect(isCoverageCareHost(null, "mapable.com.au")).toBe(false);
    expect(isCoverageCareHost(null, "peer.mapable.com.au")).toBe(false);
  });

  it("does not rewrite when master flag is off", () => {
    delete process.env.MAPABLE_COVERAGE_CARE_ENABLED;
    expect(coverageCareRewritePath("/")).toBeNull();
    expect(coverageCareRewritePath("/services")).toBeNull();
  });

  it("rewrites public paths to /t/coveragecare when enabled", () => {
    process.env.MAPABLE_COVERAGE_CARE_ENABLED = "true";
    expect(coverageCareRewritePath("/")).toBe("/t/coveragecare");
    expect(coverageCareRewritePath("/services")).toBe("/t/coveragecare/services");
    expect(coverageCareRewritePath("/t/coveragecare")).toBeNull();
    expect(coverageCareRewritePath("/coverage-care")).toBeNull();
    expect(coverageCareRewritePath("/api/coverage-care/services")).toBeNull();
    expect(coverageCareRewritePath("/robots.txt")).toBeNull();
    expect(coverageCareRewritePath("/sitemap.xml")).toBeNull();
    expect(coverageCareRewritePath("/logo.svg")).toBeNull();
  });
});
