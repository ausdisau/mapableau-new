import type { AccessibilityObservationIngest } from "./contracts";

/**
 * Development-only synthetic observation factory.
 * Always marked SYNTHETIC TEST DATA.
 */
export function buildSyntheticObservation(
  overrides: Partial<AccessibilityObservationIngest> = {},
): AccessibilityObservationIngest {
  return {
    sourceDeviceId: overrides.sourceDeviceId ?? "dev-simulator-001",
    sourceClass: "development_simulator",
    observedAt: overrides.observedAt ?? new Date().toISOString(),
    geometry: overrides.geometry ?? {
      type: "Point",
      coordinates: [151.21, -33.86],
    },
    observationType: overrides.observationType ?? "TEMPORARY_OBSTRUCTION",
    values: {
      label: "SYNTHETIC TEST DATA",
      syntheticMarker: "SYNTHETIC_TEST_DATA",
      ...overrides.values,
    },
    confidence: overrides.confidence ?? 0.4,
    synthetic: true,
    placeId: overrides.placeId,
  };
}

export function isTelemetrySimulatorAllowed(env: {
  NODE_ENV?: string;
  MAPABLE_GAIS_TELEMETRY_SIMULATOR_ENABLED?: string;
} = process.env): boolean {
  if (env.MAPABLE_GAIS_TELEMETRY_SIMULATOR_ENABLED !== "true") return false;
  if (env.NODE_ENV === "production") return false;
  return true;
}
