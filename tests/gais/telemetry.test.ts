import { describe, expect, it, beforeEach } from "vitest";

import {
  GAIS_FORBIDDEN_ACTUATION_COMMANDS,
  accessibilityObservationIngestSchema,
  assertNoActuationCommands,
  assertSensorNeverAutoVerified,
  buildSyntheticObservation,
  canTransitionPromotion,
  findForbiddenActuationCommands,
  ingestObservation,
  isTelemetrySimulatorAllowed,
  resetTelemetryStoreForTests,
  toPublicObservation,
  transitionObservationPromotion,
  validateObservationTimestamp,
} from "@/lib/gais/telemetry";
import { mapableGaisFlags } from "@/lib/config/mapable-gais";

beforeEach(() => {
  resetTelemetryStoreForTests();
});

describe("GAIS telemetry — no actuation", () => {
  it("lists forbidden mobility control commands", () => {
    expect(GAIS_FORBIDDEN_ACTUATION_COMMANDS).toEqual(
      expect.arrayContaining([
        "steer",
        "drive",
        "accelerate",
        "brake",
        "moveJoint",
        "changeDriveProfile",
      ]),
    );
  });

  it("rejects payloads containing actuation commands", () => {
    const result = accessibilityObservationIngestSchema.safeParse({
      sourceDeviceId: "dev-1",
      sourceClass: "pilot_device",
      observedAt: new Date().toISOString(),
      geometry: { type: "Point", coordinates: [151.2, -33.8] },
      observationType: "TEMPORARY_OBSTRUCTION",
      values: { steer: 0.5 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects nested actuation command keys", () => {
    expect(
      findForbiddenActuationCommands({
        command: { drive: true, accelerate: 1 },
      }),
    ).toEqual(expect.arrayContaining(["drive", "accelerate"]));
  });

  it("assertNoActuationCommands is an invariant outside GAIS", () => {
    expect(assertNoActuationCommands({ values: { widthMm: 900 } }).ok).toBe(true);
    expect(assertNoActuationCommands({ brake: true }).ok).toBe(false);
    expect(assertNoActuationCommands({ moveJoint: 3 }).ok).toBe(false);
    expect(assertNoActuationCommands({ changeDriveProfile: "sport" }).ok).toBe(false);
  });
});

describe("GAIS telemetry — ingest contract", () => {
  it("accepts allowed prototype observation types", () => {
    const parsed = accessibilityObservationIngestSchema.safeParse({
      sourceDeviceId: "device-abc",
      sourceClass: "pilot_device",
      observedAt: new Date().toISOString(),
      geometry: { type: "Point", coordinates: [151.21, -33.86] },
      observationType: "PATH_WIDTH_ESTIMATE",
      values: { widthMmEstimate: 1100 },
      confidence: 0.5,
    });
    expect(parsed.success).toBe(true);
  });

  it("requires device identity", () => {
    const parsed = accessibilityObservationIngestSchema.safeParse({
      sourceDeviceId: "",
      sourceClass: "pilot_device",
      observedAt: new Date().toISOString(),
      geometry: { type: "Point", coordinates: [151.21, -33.86] },
      observationType: "SURFACE_CHANGE",
    });
    expect(parsed.success).toBe(false);
  });

  it("validates timestamps", () => {
    expect(validateObservationTimestamp(new Date().toISOString()).ok).toBe(true);
    expect(
      validateObservationTimestamp(
        new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      ).ok,
    ).toBe(false);
    expect(
      validateObservationTimestamp(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      ).ok,
    ).toBe(false);
  });

  it("ingest always sets SENSOR_OBSERVED and received — never VERIFIED", () => {
    const obs = ingestObservation({
      ingestedByUserId: "user-a",
      payload: {
        sourceDeviceId: "d1",
        sourceClass: "pilot_device",
        observedAt: new Date().toISOString(),
        geometry: { type: "Point", coordinates: [151.2, -33.8] },
        observationType: "DOORWAY_ESTIMATE",
        values: { doorwayWidthMmEstimate: 850 },
      },
    });

    expect(obs.verificationState).toBe("SENSOR_OBSERVED");
    expect(obs.promotionState).toBe("received");
    expect(obs.verificationState).not.toBe("VERIFIED" as never);
    expect(assertSensorNeverAutoVerified(obs)).toBe(true);
  });

  it("public projection strips participant identity", () => {
    const obs = ingestObservation({
      ingestedByUserId: "secret-participant",
      payload: {
        sourceDeviceId: "d1",
        sourceClass: "pilot_device",
        observedAt: new Date().toISOString(),
        geometry: { type: "Point", coordinates: [151.2, -33.8] },
        observationType: "TEMPORARY_OBSTRUCTION",
        values: {},
      },
    });

    const pub = toPublicObservation(obs);
    expect(pub).not.toHaveProperty("ingestedByUserId");
    expect(JSON.stringify(pub)).not.toContain("secret-participant");
  });
});

describe("GAIS telemetry — promotion workflow", () => {
  it("requires stepwise promotion to publish", () => {
    expect(canTransitionPromotion("received", "published")).toBe(false);
    expect(canTransitionPromotion("received", "validated")).toBe(true);
    expect(canTransitionPromotion("validated", "candidate_evidence")).toBe(true);
    expect(canTransitionPromotion("candidate_evidence", "moderation")).toBe(true);
    expect(canTransitionPromotion("moderation", "published")).toBe(true);
  });

  it("published observation remains SENSOR_OBSERVED not VERIFIED", () => {
    const obs = ingestObservation({
      ingestedByUserId: "user-a",
      payload: {
        sourceDeviceId: "d1",
        sourceClass: "pilot_device",
        observedAt: new Date().toISOString(),
        geometry: { type: "Point", coordinates: [151.2, -33.8] },
        observationType: "TEMPORARY_OBSTRUCTION",
        values: {},
      },
    });

    for (const step of [
      "validated",
      "candidate_evidence",
      "moderation",
      "published",
    ] as const) {
      const result = transitionObservationPromotion({
        observationId: obs.observationId,
        toState: step,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.observation.verificationState).toBe("SENSOR_OBSERVED");
      }
    }
  });
});

describe("GAIS telemetry — simulator", () => {
  it("marks synthetic test data", () => {
    const synthetic = buildSyntheticObservation();
    expect(synthetic.synthetic).toBe(true);
    expect(synthetic.sourceClass).toBe("development_simulator");
    expect(synthetic.values.syntheticMarker).toBe("SYNTHETIC_TEST_DATA");
    expect(String(synthetic.values.label)).toContain("SYNTHETIC");
  });

  it("simulator disabled in production", () => {
    expect(
      isTelemetrySimulatorAllowed({
        NODE_ENV: "production",
        MAPABLE_GAIS_TELEMETRY_SIMULATOR_ENABLED: "true",
      }),
    ).toBe(false);
  });

  it("simulator requires explicit flag in non-production", () => {
    expect(
      isTelemetrySimulatorAllowed({
        NODE_ENV: "development",
        MAPABLE_GAIS_TELEMETRY_SIMULATOR_ENABLED: "false",
      }),
    ).toBe(false);
    expect(
      isTelemetrySimulatorAllowed({
        NODE_ENV: "development",
        MAPABLE_GAIS_TELEMETRY_SIMULATOR_ENABLED: "true",
      }),
    ).toBe(true);
  });
});

describe("GAIS telemetry flags", () => {
  it("defaults off", () => {
    expect(mapableGaisFlags.telemetryEnabled).toBe(false);
  });
});
