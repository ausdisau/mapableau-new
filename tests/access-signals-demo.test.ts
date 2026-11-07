import { afterEach, describe, expect, it, vi } from "vitest";

import {
  assertDemoNeverPublished,
  DEMO_ROUTES,
  REMEDIATION_ISSUES,
} from "@/lib/access-signals/demo-data";
import { isAccessSignalsDemoEnabled } from "@/lib/access-signals/policy";
import {
  getRaguDescriptor,
  RAGU_LEGEND,
  raguAnnouncement,
} from "@/lib/access-signals/ragu";

describe("Access Signals synthetic demo", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("defaults off and hard-denies production", () => {
    expect(isAccessSignalsDemoEnabled()).toBe(false);
    vi.stubEnv("MAPABLE_ACCESS_SIGNALS_DEMO_ENABLED", "true");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isAccessSignalsDemoEnabled()).toBe(true);
    vi.stubEnv("VERCEL_ENV", "production");
    expect(isAccessSignalsDemoEnabled()).toBe(false);
  });

  it("keeps demo routes synthetic and unpublished", () => {
    expect(assertDemoNeverPublished()).toBe(true);
    for (const route of DEMO_ROUTES) {
      expect(route.synthetic).toBe(true);
      expect(route.published).toBe(false);
    }
    expect(REMEDIATION_ISSUES.length).toBe(3);
  });

  it("exposes RAGU with text and shape (not colour-only)", () => {
    expect(RAGU_LEGEND).toHaveLength(4);
    for (const status of ["red", "amber", "green", "unknown"] as const) {
      const descriptor = getRaguDescriptor(status);
      expect(descriptor.label.length).toBeGreaterThan(0);
      expect(descriptor.shape).toBeTruthy();
      expect(raguAnnouncement(status)).toContain(descriptor.label);
    }
  });
});
