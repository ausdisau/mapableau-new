import type { MapAbleActionResult } from "./types";

const missionResults = new Map<string, MapAbleActionResult[]>();

/** Feed execution results back to Mission Runtime (in-memory until durable store). */
export function appendMissionActionResult(
  missionId: string,
  result: MapAbleActionResult,
): void {
  const existing = missionResults.get(missionId) ?? [];
  existing.push(result);
  missionResults.set(missionId, existing);
}

export function listMissionActionResults(
  missionId: string,
): MapAbleActionResult[] {
  return missionResults.get(missionId) ?? [];
}

export function getLatestMissionActionResult(
  missionId: string,
): MapAbleActionResult | null {
  const results = listMissionActionResults(missionId);
  return results.at(-1) ?? null;
}

/** Test helper */
export function clearMissionActionResults(): void {
  missionResults.clear();
}
