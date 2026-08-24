import type {
  InAppWatchAlert,
  MapAbleMissionWatch,
  MissionWatchTickResult,
} from "./types";

const watchesByMission = new Map<string, MapAbleMissionWatch[]>();
const alertsByMission = new Map<string, InAppWatchAlert[]>();
const revokedConsentByParticipant = new Map<string, Set<string>>();
const tickLog: MissionWatchTickResult[] = [];

export function saveWatch(watch: MapAbleMissionWatch): void {
  const existing = watchesByMission.get(watch.missionId) ?? [];
  const idx = existing.findIndex((w) => w.watchId === watch.watchId);
  if (idx >= 0) existing[idx] = watch;
  else existing.push(watch);
  watchesByMission.set(watch.missionId, existing);
}

export function getWatch(
  missionId: string,
  watchId: string,
): MapAbleMissionWatch | null {
  return (watchesByMission.get(missionId) ?? []).find((w) => w.watchId === watchId) ?? null;
}

export function listWatches(missionId: string): MapAbleMissionWatch[] {
  return [...(watchesByMission.get(missionId) ?? [])];
}

export function listEnabledWatches(missionId: string): MapAbleMissionWatch[] {
  return listWatches(missionId).filter((w) => w.enabled);
}

export function saveAlert(alert: InAppWatchAlert): void {
  const existing = alertsByMission.get(alert.missionId) ?? [];
  if (existing.some((a) => a.alertId === alert.alertId)) return;
  if (existing.some((a) => a.fingerprint === alert.fingerprint && !a.dismissed)) return;
  existing.push(alert);
  alertsByMission.set(alert.missionId, existing);
}

export function listAlerts(missionId: string): InAppWatchAlert[] {
  return [...(alertsByMission.get(missionId) ?? [])];
}

export function listActiveAlerts(missionId: string): InAppWatchAlert[] {
  return listAlerts(missionId).filter((a) => !a.dismissed);
}

export function dismissAlert(
  missionId: string,
  alertId: string,
): InAppWatchAlert | null {
  const alerts = alertsByMission.get(missionId) ?? [];
  const alert = alerts.find((a) => a.alertId === alertId);
  if (!alert) return null;
  alert.dismissed = true;
  return alert;
}

export function revokeConsentScope(participantId: string, scope: string): void {
  const set = revokedConsentByParticipant.get(participantId) ?? new Set();
  set.add(scope);
  revokedConsentByParticipant.set(participantId, set);
  for (const watches of watchesByMission.values()) {
    for (const watch of watches) {
      const required = watch.condition.requiredConsentScopes ?? [];
      if (required.includes(scope)) {
        saveWatch({
          ...watch,
          consentRevoked: true,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }
}

export function getRevokedConsentScopes(participantId: string): string[] {
  return [...(revokedConsentByParticipant.get(participantId) ?? [])];
}

export function clearRevokedConsent(participantId?: string): void {
  if (participantId) revokedConsentByParticipant.delete(participantId);
  else revokedConsentByParticipant.clear();
}

export function recordTick(result: MissionWatchTickResult): void {
  tickLog.push(result);
}

export function getTickLog(): MissionWatchTickResult[] {
  return [...tickLog];
}

/** Test helper — in-memory only (Prompt 06 persistence limitation). */
export function clearMissionWatchStore(): void {
  watchesByMission.clear();
  alertsByMission.clear();
  revokedConsentByParticipant.clear();
  tickLog.length = 0;
}
