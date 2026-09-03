import { describe, expect, it } from "vitest";

import { projectCurrentStateFromObservations } from "@/lib/access/realtime/current-state";
import { createUnverifiedProvenance, normalizedObservationSchema } from "@/lib/integrations/access/contracts";
import { mapSensorThingsObservation } from "@/lib/integrations/access/sensorthings/mapper";

describe("sensorthings temporal", () => {
  it("normalizes observation as unverified sensor reading", () => {
    const obs = mapSensorThingsObservation(
      {
        "@iot.id": 1,
        phenomenonTime: "2026-01-01T10:00:00Z",
        result: 42,
        Feature: { geometry: { type: "Point", coordinates: [151.2, -33.87] } },
      },
      { datastreamName: "temperature", unit: "C" },
    );
    expect(obs.provenance.verificationState).toBe("UNVERIFIED");
    expect(obs.provenance.contributorType).toBe("SENSOR");
    expect(obs.notes).toMatch(/not verified human capability/i);
  });

  it("projects current state without verified capability", () => {
    const base = {
      featureType: "sensor",
      attribute: "temperature",
      value: 20,
      valueQualifier: "MEASURED" as const,
      provenance: createUnverifiedProvenance({
        sourceProvider: "sensorthings",
        contributorType: "SENSOR",
      }),
      claimStrength: "observation" as const,
    };
    const older = normalizedObservationSchema.parse({
      ...base,
      observedAt: "2026-01-01T09:00:00Z",
      value: 18,
    });
    const newer = normalizedObservationSchema.parse({
      ...base,
      observedAt: "2026-01-01T10:00:00Z",
      value: 22,
    });
    const states = projectCurrentStateFromObservations([older, newer]);
    expect(states[0].currentValue).toBe(22);
    expect(states[0].verifiedCapability).toBe(false);
    expect(states[0].historyCount).toBe(2);
  });
});
