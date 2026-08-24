import type { MapAbleMissionPlan } from "./types";

const plans = new Map<string, MapAbleMissionPlan>();

/** In-memory mission plan store — no Prisma migration in Prompt 01. */
export function saveMissionPlan(plan: MapAbleMissionPlan): void {
  plans.set(plan.missionId, plan);
}

export function getMissionPlan(missionId: string): MapAbleMissionPlan | null {
  return plans.get(missionId) ?? null;
}

export function deleteMissionPlan(missionId: string): void {
  plans.delete(missionId);
}

/** Test helper */
export function clearMissionPlanStore(): void {
  plans.clear();
}
