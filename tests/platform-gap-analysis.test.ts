import { describe, expect, it } from "vitest";

import { PUBLIC_LAUNCH_CHECKLIST } from "@/lib/launch-readiness/public-launch-checklist";
import {
  PLATFORM_GAP_CATALOG,
  assertUniqueCatalogCodes,
} from "@/lib/platform-gaps/gap-catalog";
import {
  getStubIntegrationKeysForTests,
  runPlatformGapDetector,
} from "@/lib/platform-gaps/detectors";
import { CORE_ECOSYSTEM_APPS } from "@/lib/core-ui/ecosystem";

describe("platform gap catalog", () => {
  it("has unique codes", () => {
    expect(() => assertUniqueCatalogCodes()).not.toThrow();
    expect(PLATFORM_GAP_CATALOG.length).toBeGreaterThanOrEqual(20);
  });

  it("includes launch_ops items with launch item codes", () => {
    const launch = PLATFORM_GAP_CATALOG.filter((e) => e.category === "launch_ops");
    expect(launch.length).toBe(PUBLIC_LAUNCH_CHECKLIST.length);
    expect(launch.every((e) => e.launchItemCode)).toBe(true);
  });
});

describe("platform gap detectors", () => {
  it("ecosystem_roadmap reports open when all apps are roadmap", async () => {
    const entry = PLATFORM_GAP_CATALOG.find((e) => e.code === "bp.satellite_apps");
    expect(entry).toBeDefined();
    const result = await runPlatformGapDetector(entry!);
    expect(CORE_ECOSYSTEM_APPS.every((a) => a.status === "roadmap")).toBe(true);
    expect(result.detectedStatus).toBe("open");
    expect(result.detectedSummary).toMatch(/satellite/i);
  });

  it("static_met returns met for policy gaps", async () => {
    const entry = PLATFORM_GAP_CATALOG.find(
      (e) => e.code === "compliance.no_auto_ndis_commission"
    );
    const result = await runPlatformGapDetector(entry!);
    expect(result.detectedStatus).toBe("met");
  });

  it("integration_stubs summary does not include secrets", async () => {
    const entry = PLATFORM_GAP_CATALOG.find((e) => e.code === "integ.stub_engines");
    const result = await runPlatformGapDetector(entry!);
    expect(result.detectedSummary).not.toMatch(/sk_live|api_key|secret/i);
  });

  it("stub keys list matches registry expectations", () => {
    const keys = getStubIntegrationKeysForTests();
    expect(keys).toContain("temporal");
    expect(keys).toContain("keycloak");
  });
});

describe("platform gap effective status merge", () => {
  it("maps detected status to default effective resolution", async () => {
    const { mapDetectedToEffectiveStatus } = await import(
      "@/lib/platform-gaps/platform-gap-service"
    );
    expect(mapDetectedToEffectiveStatus("met")).toBe("mitigated");
    expect(mapDetectedToEffectiveStatus("partial")).toBe("in_progress");
    expect(mapDetectedToEffectiveStatus("open")).toBe("open");
    expect(mapDetectedToEffectiveStatus("not_applicable")).toBe("closed");
  });
});
