import type { MapAbleMissionPlan } from "@/lib/ai/platform/missions/types";

import type { MapAbleMissionEvent, MapAbleRecoveryState, MissionPlanVersion, RecoveryActivityEntry } from "./types";

const eventsByMission = new Map<string, MapAbleMissionEvent[]>();
const idempotencyKeys = new Set<string>();
const planVersions = new Map<string, MissionPlanVersion[]>();
const recoveryStates = new Map<string, MapAbleRecoveryState>();
const activityLog = new Map<string, RecoveryActivityEntry[]>();

export function saveMissionEvent(event: MapAbleMissionEvent): { saved: boolean; duplicate: boolean } {
  if (event.idempotencyKey) {
    const key = `${event.missionId}:${event.idempotencyKey}`;
    if (idempotencyKeys.has(key)) return { saved: false, duplicate: true };
    idempotencyKeys.add(key);
  }
  const existing = eventsByMission.get(event.missionId) ?? [];
  if (existing.some(e => e.eventId === event.eventId)) return { saved: false, duplicate: true };
  existing.push(event); eventsByMission.set(event.missionId, existing);
  return { saved: true, duplicate: false };
}
export function getMissionEvents(missionId: string) { return eventsByMission.get(missionId) ?? []; }
export function getPendingEvents(missionId: string) {
  const state = recoveryStates.get(missionId);
  if (!state) return getMissionEvents(missionId);
  return state.pendingEvents.length ? state.pendingEvents : getMissionEvents(missionId);
}
export function savePlanVersion(version: MissionPlanVersion) {
  const existing = planVersions.get(version.missionId) ?? []; existing.push(version); planVersions.set(version.missionId, existing);
}
export function getPlanVersions(missionId: string) { return planVersions.get(missionId) ?? []; }
export function getPlanVersion(missionId: string, planVersion: number) {
  return getPlanVersions(missionId).find(v => v.planVersion === planVersion) ?? null;
}
export function getLatestPlanVersion(missionId: string) {
  const versions = getPlanVersions(missionId); if (!versions.length) return null;
  return versions.reduce((latest, v) => v.planVersion > latest.planVersion ? v : latest);
}
export function saveRecoveryState(state: MapAbleRecoveryState) { recoveryStates.set(state.missionId, state); }
export function getRecoveryState(missionId: string) { return recoveryStates.get(missionId) ?? null; }
export function appendActivity(missionId: string, entry: RecoveryActivityEntry) {
  const existing = activityLog.get(missionId) ?? []; existing.push(entry); activityLog.set(missionId, existing);
}
export function getActivityLog(missionId: string) { return activityLog.get(missionId) ?? []; }
export function initialiseRecoveryFromPlan(plan: MapAbleMissionPlan) {
  const version: MissionPlanVersion = {
    missionId: plan.missionId, planVersion: plan.planVersion ?? 1, basedOnVersion: plan.basedOnVersion ?? null,
    changeReason: plan.changeReason ?? "Initial plan", plan, createdAt: plan.createdAt,
  };
  if (!getPlanVersions(plan.missionId).some(v => v.planVersion === version.planVersion)) savePlanVersion(version);
  if (!recoveryStates.has(plan.missionId)) {
    saveRecoveryState({
      missionId: plan.missionId, currentPlanVersion: version.planVersion, activePlanVersion: version.planVersion,
      candidatePlanVersion: null, status: "stable", trigger: null, impacts: [], materialityGate: "NON_MATERIAL",
      approvalImpacts: [], alternatives: [], whatChanged: [], previousPlanVersions: [], pendingEvents: [],
      lastReassessedAt: null, killSwitchActive: false,
    });
  }
}
export function clearRecoveryStore() {
  eventsByMission.clear(); idempotencyKeys.clear(); planVersions.clear(); recoveryStates.clear(); activityLog.clear();
}
export function nextPlanVersion(missionId: string) { return (getLatestPlanVersion(missionId)?.planVersion ?? 0) + 1; }
