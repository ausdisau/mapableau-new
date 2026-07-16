import { describe, expect, it } from "vitest";
import type { PersonalFitResult } from "@mapable/access-fit";
import type { AccessibleRouteSummary } from "@mapable/access-routing";
import {
  ACCESS_INTELLIGENCE_PURPOSE_CODES,
  type DisclosureGrant,
} from "@mapable/access-consent";
import { buildListAlternativeLines } from "@mapable/access-react";
import {
  FIXTURE_BUILDING_CAFE,
  FIXTURE_BUILDING_HALL,
  FIXTURE_PASSPORT_WHEELCHAIR,
} from "@mapable/access-test-fixtures";

describe("access SDK packages", () => {
  it("access-fit exports personal-fit types", () => {
    const result: PersonalFitResult = {
      status: "suitable_with_conditions",
      blockers: [],
      conditions: ["confirm step-free route"],
      unknowns: ["lift status"],
      confidenceLabel: "moderate",
    };
    expect(result.status).toBe("suitable_with_conditions");
  });

  it("access-routing exports route summary types", () => {
    const route: AccessibleRouteSummary = {
      placeId: "place-1",
      segments: [
        {
          fromLabel: "Entrance",
          toLabel: "Lift",
          mode: "walk",
          stepFree: true,
          notes: [],
        },
      ],
      blockers: [],
      unknowns: [],
      listAlternative: ["Walk from entrance to lift — step-free."],
    };
    expect(route.segments).toHaveLength(1);
  });

  it("access-consent exports purpose codes", () => {
    expect(ACCESS_INTELLIGENCE_PURPOSE_CODES).toContain(
      "access.passport_share_preview",
    );
    const grant: DisclosureGrant = {
      purposeCode: "access.visit_plan_share",
      fieldsShared: ["mobility"],
      fieldsOmitted: ["diagnosis"],
      recipientLabel: "Venue",
      expiresAt: new Date().toISOString(),
    };
    expect(grant.fieldsOmitted).toContain("diagnosis");
  });

  it("access-react builds list alternative lines", () => {
    const lines = buildListAlternativeLines({
      placeName: "Test Cafe",
      features: [
        {
          type: "step_free",
          summary: "not available",
          unknown: false,
          source: "community",
          observedAt: "2026-01-01",
          confidenceLabel: "community reported",
        },
      ],
      unknowns: ["lift"],
    });
    expect(lines[0]).toContain("Test Cafe");
    expect(lines.some((l: string) => l.includes("step_free"))).toBe(true);
  });

  it("access-test-fixtures provides synthetic buildings and passports", () => {
    expect(FIXTURE_PASSPORT_WHEELCHAIR.requirements.length).toBeGreaterThan(0);
    expect(FIXTURE_BUILDING_CAFE.stepFree).toBe(false);
    expect(FIXTURE_BUILDING_HALL.stepFree).toBe(true);
  });
});
