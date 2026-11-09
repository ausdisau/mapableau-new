import { afterEach, describe, expect, it } from "vitest";

import {
  getTenantPreviewGate,
  isTenantPreviewPath,
} from "@/lib/tenancy/tenant-preview-policy";

describe("tenant preview policy", () => {
  afterEach(() => {
    delete process.env.MAPABLE_COVERAGE_CARE_ENABLED;
    delete process.env.MAPABLE_COVERAGE_CARE_BRANDOS_ENABLED;
  });

  it("defaults master and host rewrite OFF", () => {
    delete process.env.MAPABLE_COVERAGE_CARE_ENABLED;
    const gate = getTenantPreviewGate();
    expect(gate.masterEnabled).toBe(false);
    expect(gate.hostRewriteEnabled).toBe(false);
    expect(gate.syntheticBanner).toContain("SYNTHETIC DEMO");
  });

  it("enables host rewrite only when master flag is true", () => {
    process.env.MAPABLE_COVERAGE_CARE_ENABLED = "true";
    expect(getTenantPreviewGate().hostRewriteEnabled).toBe(true);
    process.env.MAPABLE_COVERAGE_CARE_ENABLED = "1";
    expect(getTenantPreviewGate().hostRewriteEnabled).toBe(false);
  });

  it("recognises preview pathnames", () => {
    expect(isTenantPreviewPath("/t/coveragecare")).toBe(true);
    expect(isTenantPreviewPath("/coverage-care/services")).toBe(true);
    expect(isTenantPreviewPath("/")).toBe(false);
  });
});
