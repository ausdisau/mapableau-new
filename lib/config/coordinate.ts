/**
 * Feature flags for MapAble Coordinate — human-in-the-loop support coordination.
 */
export const coordinateConfig = {
  enabled: process.env.MAPABLE_COORDINATE_ENABLED === "true",
  aiEnabled: process.env.MAPABLE_COORDINATE_AI_ENABLED === "true",
  aiEngineId:
    process.env.MAPABLE_COORDINATE_AI_ENGINE_ID ?? "coordinate-rules-v1",
} as const;

export type CoordinateConfig = typeof coordinateConfig;

export class CoordinateDisabledError extends Error {
  constructor() {
    super("MapAble Coordinate is not enabled");
    this.name = "CoordinateDisabledError";
  }
}

export function assertCoordinateEnabled(): void {
  if (!coordinateConfig.enabled) {
    throw new CoordinateDisabledError();
  }
}
