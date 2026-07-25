/**
 * Feature flag for Zero-Touch PACE Telemetry Claiming scaffold.
 * Default off — must be explicitly enabled with === "true".
 */
export function isPaceTelemetryClaimingEnabled(): boolean {
  return process.env.MAPABLE_PACE_TELEMETRY_CLAIMING_ENABLED === "true";
}

/** Geofence radius (metres) between check-in and check-out for scaffold warnings. */
export const PACE_GEOFENCE_RADIUS_METERS = 200;
