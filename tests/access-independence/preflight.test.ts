import { describe, expect, it } from "vitest";

import type { PlaceAccessProfile } from "@/lib/access-fit/types";
import {
  buildAccessPreflight,
  buildAccessPreflightFromEvidence,
  parseDoorWidthMm,
  resolveFactFromEvidence,
} from "@/lib/access-preflight/build-preflight";
import type { DemoAccessPlace } from "@/lib/demo/accessibility-places";
import type { AccessEvidenceRecord } from "@/types/access-preflight";

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
    accessScore: 92,
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

describe("Access Preflight evidence honesty", () => {
  it("keeps missing facts as unknown and never treats them as no barriers", () => {
    const result = buildAccessPreflight(place(emptyProfile()));
    const unknown = result.facts.filter((fact) => fact.state === "unknown");
    expect(unknown.length).toBeGreaterThan(0);
    expect(result.nextActions.join(" ").toLowerCase()).not.toContain(
      "no barriers",
    );
    expect(result.unresolvedCritical.length).toBeGreaterThan(0);
    expect(
      result.facts.some((fact) =>
        fact.explanation.toLowerCase().includes("unknown is not the same as accessible"),
      ),
    ).toBe(true);
  });

  it("marks confirmed and unavailable facts only from explicit profile fields", () => {
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
    expect(
      result.facts.find((fact) => fact.id === "support_person")?.state,
    ).toBe("unknown");
    const door = result.facts.find((fact) => fact.id === "door_width");
    expect(door?.state).toBe("confirmed");
    expect(door?.value).toBe(900);
    expect(door?.explanation).toMatch(/source:/i);
  });

  it("does not confirm accessible width from a 700 mm measurement", () => {
    const result = buildAccessPreflight(
      place(emptyProfile({ doorWidthMm: 700 })),
    );
    const door = result.facts.find((fact) => fact.id === "door_width");
    expect(door?.state).toBe("unavailable");
    expect(door?.value).toBe(700);
    expect(door?.unit).toBe("mm");
  });

  it("leaves unparsed door notes as unknown", () => {
    expect(parseDoorWidthMm("wide enough for most chairs")).toBeNull();
    const rich = place(emptyProfile());
    rich.measurements = [
      { label: "Entrance door clear width", value: "wide enough" },
    ];
    const result = buildAccessPreflight(rich);
    expect(result.facts.find((f) => f.id === "door_width")?.state).toBe(
      "unknown",
    );
  });

  it("does not confirm from floor plan, staff training, sensory notes or scores", () => {
    const rich = place(
      emptyProfile({
        stepFreeEntry: true,
        doorWidthMm: null,
        staffTraining: true,
      }),
    );
    rich.measurements = [
      { label: "Entrance door clear width", value: "920 mm" },
    ];
    rich.sensoryNotes = ["Quiet study rooms available"];
    rich.domains = [
      {
        name: "Emergency",
        summary: "Evacuation plan on wall",
        status: "known",
      },
    ];
    rich.hasFloorPlan = true;
    rich.topAccessFacts = ["Changing Places facility on ground floor"];
    rich.accessScore = 98;

    const result = buildAccessPreflight(rich);
    expect(result.facts.find((f) => f.id === "door_width")?.state).toBe(
      "unknown",
    );
    expect(result.facts.find((f) => f.id === "quiet_low_sensory")?.state).toBe(
      "unknown",
    );
    expect(result.facts.find((f) => f.id === "lighting_noise")?.state).toBe(
      "unknown",
    );
    expect(result.facts.find((f) => f.id === "changing_places")?.state).toBe(
      "unknown",
    );
    expect(result.facts.find((f) => f.id === "alternative_route")?.state).toBe(
      "unknown",
    );
    expect(result.facts.find((f) => f.id === "support_person")?.state).toBe(
      "unknown",
    );
    expect(
      result.facts.find((f) => f.id === "emergency_evacuation")?.state,
    ).toBe("unknown");
  });

  it("rejects disputed or expired evidence for current confirmation", () => {
    const evidence: AccessEvidenceRecord[] = [
      {
        factType: "step_free_entrance",
        state: "confirmed",
        source: "provider",
        confidence: "high",
        disputeState: "disputed",
        verifiedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        factType: "accessible_toilet",
        state: "confirmed",
        source: "provider",
        confidence: "high",
        disputeState: "none",
        expiresAt: "2020-01-01T00:00:00.000Z",
        verifiedAt: "2019-01-01T00:00:00.000Z",
      },
    ];
    expect(resolveFactFromEvidence("step_free_entrance", evidence).state).toBe(
      "unknown",
    );
    expect(resolveFactFromEvidence("accessible_toilet", evidence).state).toBe(
      "unknown",
    );
  });

  it("exposes source and verification date on confirmed facts", () => {
    const result = buildAccessPreflightFromEvidence({
      placeName: "Clinic",
      evidence: [
        {
          factType: "step_free_entrance",
          state: "confirmed",
          source: "independently_verified",
          confidence: "high",
          disputeState: "none",
          verifiedAt: "2026-06-01T00:00:00.000Z",
          verificationMethod: "site_audit",
        },
      ],
    });
    const fact = result.facts.find((row) => row.id === "step_free_entrance");
    expect(fact?.state).toBe("confirmed");
    expect(fact?.source).toBe("independently_verified");
    expect(fact?.lastCheckedAt).toBe("2026-06-01T00:00:00.000Z");
    expect(fact?.explanation).toMatch(/verified:/i);
  });
});
