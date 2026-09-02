/**
 * Attention budget — deterministic deduplication and escalation.
 */

import type {
  InAppWatchAlert,
  MapAbleMissionWatch,
  WatchRuleResult,
  WatchSeverity,
} from "./types";

const SEVERITY_RANK: Record<WatchSeverity, number> = {
  info: 0,
  attention: 1,
  urgent: 2,
  critical: 3,
};

export function buildWatchFingerprint(input: {
  watchId: string;
  watchType: string;
  missionId: string;
  conditionKey: string;
  severity: WatchSeverity;
}): string {
  return [
    input.missionId,
    input.watchId,
    input.watchType,
    input.conditionKey,
    input.severity,
  ].join("|");
}

export function shouldSuppressDuplicate(input: {
  watch: MapAbleMissionWatch;
  fingerprint: string;
  referenceTime: Date;
  minResendMinutes?: number;
}): { suppress: boolean; reason: string | null } {
  if (!input.watch.enabled) {
    return { suppress: true, reason: "watch_disabled" };
  }
  if (input.watch.consentRevoked) {
    return { suppress: true, reason: "consent_revoked" };
  }
  if (input.watch.snoozedUntil) {
    if (new Date(input.watch.snoozedUntil).getTime() > input.referenceTime.getTime()) {
      return { suppress: true, reason: "snoozed" };
    }
  }
  if (input.watch.expiresAt) {
    if (new Date(input.watch.expiresAt).getTime() <= input.referenceTime.getTime()) {
      return { suppress: true, reason: "expired" };
    }
  }
  if (input.watch.lastFiredFingerprint === input.fingerprint && input.watch.lastFiredAt) {
    const minResend = input.minResendMinutes ?? 60;
    const elapsed =
      (input.referenceTime.getTime() - new Date(input.watch.lastFiredAt).getTime()) /
      60_000;
    if (elapsed < minResend) {
      return { suppress: true, reason: "duplicate_unchanged_condition" };
    }
  }
  return { suppress: false, reason: null };
}

export function escalateSeverity(
  current: WatchSeverity,
  previous: WatchSeverity | null,
): WatchSeverity {
  if (!previous) return current;
  return SEVERITY_RANK[current] >= SEVERITY_RANK[previous] ? current : previous;
}

export function dedupeAlerts(alerts: InAppWatchAlert[]): InAppWatchAlert[] {
  const byFingerprint = new Map<string, InAppWatchAlert>();
  for (const alert of alerts) {
    const existing = byFingerprint.get(alert.fingerprint);
    if (!existing || SEVERITY_RANK[alert.severity] > SEVERITY_RANK[existing.severity]) {
      byFingerprint.set(alert.fingerprint, alert);
    }
  }
  return [...byFingerprint.values()];
}

export function partitionResults(results: WatchRuleResult[]): {
  fired: WatchRuleResult[];
  suppressed: WatchRuleResult[];
} {
  return {
    fired: results.filter((r) => r.fired && !r.suppressed),
    suppressed: results.filter((r) => r.suppressed || !r.fired),
  };
}
