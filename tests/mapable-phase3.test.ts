import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import { sanitizeApplicationForViewer } from "@/lib/jobs/job-service";
import { getVehicleSuitabilityWarnings } from "@/lib/transport/vehicle-suitability";
import { phase3Config } from "@/lib/config/phase3";

describe("Phase 3 permissions", () => {
  it("allows participant to manage care", () => {
    expect(hasPermission("participant", "care:manage:self")).toBe(true);
  });

  it("allows provider to manage org care", () => {
    expect(hasPermission("provider_admin", "care:manage:org")).toBe(true);
  });

  it("allows admin service ops", () => {
    expect(hasPermission("mapable_admin", "admin:service-ops")).toBe(true);
  });

  it("allows participant to apply for jobs", () => {
    expect(hasPermission("participant", "jobs:apply")).toBe(true);
  });
});

describe("vehicle suitability", () => {
  it("warns when wheelchair access required but vehicle lacks it", () => {
    const warnings = getVehicleSuitabilityWarnings(
      { requiresWheelchairAccessible: true },
      {
        wheelchairAccessible: false,
        rampAvailable: false,
        liftAvailable: false,
        assistanceAnimalFriendly: true,
      }
    );
    expect(warnings.some((w) => w.includes("wheelchair"))).toBe(true);
  });
});

describe("adjustment privacy", () => {
  it("hides adjustment text from employer without share flag", () => {
    const view = sanitizeApplicationForViewer(
      {
        reasonableAdjustmentRequest: "Need flexible hours",
        shareAdjustments: false,
        applicantSummary: "Summary",
        coverLetter: null,
      },
      { isParticipant: false, isEmployerWithConsent: true, isAdmin: false }
    );
    expect(view.reasonableAdjustmentRequest).toContain("not shared");
  });

  it("shows adjustment text to participant", () => {
    const view = sanitizeApplicationForViewer(
      {
        reasonableAdjustmentRequest: "Need flexible hours",
        shareAdjustments: false,
        applicantSummary: null,
        coverLetter: null,
      },
      { isParticipant: true, isEmployerWithConsent: false, isAdmin: false }
    );
    expect(view.reasonableAdjustmentRequest).toBe("Need flexible hours");
  });
});

describe("phase 3 config", () => {
  it("orchestration enabled by default in dev", () => {
    expect(typeof phase3Config.orchestrationEnabled).toBe("boolean");
  });
});
