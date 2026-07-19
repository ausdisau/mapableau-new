import { describe, expect, it } from "vitest";

import type { PlaceAccessProfile } from "@/lib/access-fit/types";
import { buildAccessPreflight } from "@/lib/access-preflight/build-preflight";
import type { DemoAccessPlace } from "@/lib/demo/accessibility-places";

function emptyProfile(
  overrides: Partial<PlaceAccessProfile> = {},
): PlaceAccessProfile {
  return {
    stepFreeEntry: null,
    doorWidthMm: null,
    internalStepFree: null,
    accessibleToilet: null,
    accessibleParking: null,
    dropOffPoint: null,
    lowSensoryOption: null,
    hearingLoop: null,
    staffTraining: null,
    assistanceAnimalWelcome: null,
    publicTransportNearby: null,
    transportBookable: null,
    lastVerified: null,
    confidence: "unknown",
    ...overrides,
  };
}

function place(profile: PlaceAccessProfile): DemoAccessPlace {
  return {
    id: "place-1",
    slug: "demo-cafe",
    name: "Demo Cafe",
    category: "cafe",
    suburb: "Sydney",
    state: "NSW",
    latitude: -33.86,
    longitude: 151.2,
    accessScore: 0,
    tier: "Unverified",
    confidence: "medium",
    lastChecked: "2026-01-01",
    source: "community",
    topAccessFacts: [],
    keyBarrier: null,
    isDemo: true,
    profile,
    measurements: [],
    sensoryNotes: [],
    domains: [],
  };
}

describe("Access Preflight", () => {
  it("keeps missing facts as unknown and never treats them as no barriers", () => {
    const result = buildAccessPreflight(place(emptyProfile()));
    const unknown = result.facts.filter((fact) => fact.state === "unknown");
    expect(unknown.length).toBeGreaterThan(0);
    expect(
      result.nextActions.join(" ").toLowerCase(),
    ).not.toContain("no barriers");
    expect(result.unresolvedCritical.length).toBeGreaterThan(0);
    expect(
      result.facts.some((fact) =>
        fact.notes?.toLowerCase().includes("unknown is not the same as accessible"),
      ),
    ).toBe(true);
  });

  it("marks confirmed and unavailable facts when profile data exists", () => {
    const result = buildAccessPreflight(
      place(
        emptyProfile({
          stepFreeEntry: true,
          doorWidthMm: 900,
          internalStepFree: true,
          accessibleToilet: true,
          accessibleParking: true,
          dropOffPoint: true,
          lowSensoryOption: false,
          assistanceAnimalWelcome: true,
          hearingLoop: true,
          staffTraining: true,
        }),
      ),
    );
    expect(
      result.facts.find((fact) => fact.id === "step_free_entrance")?.state,
    ).toBe("confirmed");
    expect(
      result.facts.find((fact) => fact.id === "quiet_low_sensory")?.state,
    ).toBe("unavailable");
    expect(
      result.facts.find((fact) => fact.id === "changing_places")?.state,
    ).toBe("unknown");
  });

  it("uses measurements, sensory notes and domains without inventing confirmed access", () => {
    const rich = place(
      emptyProfile({
        stepFreeEntry: true,
        doorWidthMm: null,
        accessibleToilet: null,
      }),
    );
    rich.measurements = [
      { label: "Entrance door clear width", value: "920 mm" },
      { label: "Path to entrance gradient", value: "1:20" },
    ];
    rich.sensoryNotes = ["Quiet study rooms available"];
    rich.domains = [
      {
        name: "External path of travel",
        summary: "Ramped path from street.",
        status: "known",
      },
      {
        name: "Internal movement",
        summary: "Lift to public floors.",
        status: "known",
      },
    ];
    rich.hasFloorPlan = true;
    rich.topAccessFacts = ["Changing Places facility on ground floor"];

    const result = buildAccessPreflight(rich);
    expect(result.facts.find((f) => f.id === "door_width")?.state).toBe(
      "confirmed",
    );
    expect(
      result.facts.find((f) => f.id === "surface_gradient_kerb")?.state,
    ).toBe("confirmed");
    expect(result.facts.find((f) => f.id === "quiet_low_sensory")?.state).toBe(
      "confirmed",
    );
    expect(result.facts.find((f) => f.id === "changing_places")?.state).toBe(
      "confirmed",
    );
    expect(result.facts.find((f) => f.id === "alternative_route")?.state).toBe(
      "confirmed",
    );
    expect(
      result.facts.find((f) => f.id === "equipment_charging")?.state,
    ).toBe("unknown");
  });
});
