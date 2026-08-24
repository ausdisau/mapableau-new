import { randomUUID } from "node:crypto";

import { getMissionPlan } from "@/lib/ai/platform/missions/store";
import type { MapAbleMissionPlan } from "@/lib/ai/platform/missions/types";
import {
  ensureMissionRecoveryTracking,
  ingestMissionEvent,
} from "@/lib/ai/platform/recovery";
import { adaptiveRecoveryConfig } from "@/lib/config/adaptive-recovery";
import { agenticNerveCentreConfig } from "@/lib/config/agentic-nerve-centre";
import { missionWatchConfig } from "@/lib/config/mission-watch";

import { createInAppAlertFromResult } from "./alerts";
import { partitionResults } from "./attention";
import { loadContextHints } from "./context-adapter";
import { isClinicalMonitoringForbidden } from "./policy";
import {
  defaultSeverityForType,
  isOptionalWatchType,
  MISSION_WATCH_FEATURE_FLAG,
} from "./registry";
import { evaluateWatchRule } from "./rules";
import type { CreateWatchBody } from "./schemas";
import {
  dismissAlert,
  getRevokedConsentScopes,
  getWatch,
  listActiveAlerts,
  listEnabledWatches,
  listWatches,
  recordTick,
  revokeConsentScope,
  saveAlert,
  saveWatch,
} from "./store";
import { DEFAULT_MISSION_TIMEZONE, nextEvaluationFromTrigger } from "./temporal";
import type {
  MapAbleMissionWatch,
  MissionWatchTickResult,
  ParticipantWatchAction,
  WatchEvaluationContext,
} from "./types";

export type CreateWatchInput = CreateWatchBody & {
  missionId: string;
  createdBy: string;
  traceId?: string;
};

export function createMissionWatch(input: CreateWatchInput): MapAbleMissionWatch {
  assertWatchSurfaceEnabled();
  if (isClinicalMonitoringForbidden(input.watchType)) {
    throw new Error("CLINICAL_MONITORING_FORBIDDEN");
  }
  if (!getMissionPlan(input.missionId)) throw new Error("MISSION_NOT_FOUND");

  const now = new Date();
  const optional = isOptionalWatchType(input.watchType, input.optional);
  const watch: MapAbleMissionWatch = {
    watchId: randomUUID(),
    missionId: input.missionId,
    watchType: input.watchType,
    triggerAt: input.triggerAt ?? null,
    condition: input.condition ?? {},
    affectedNodeIds: input.affectedNodeIds ?? [],
    enabled: true,
    createdBy: input.createdBy,
    participantVisible: input.participantVisible ?? true,
    nextEvaluationAt:
      input.nextEvaluationAt ??
      nextEvaluationFromTrigger(input.triggerAt ?? null, now),
    expiresAt: input.expiresAt ?? null,
    featureFlag: MISSION_WATCH_FEATURE_FLAG,
    traceId: input.traceId ?? randomUUID(),
    timeZone: input.timeZone ?? DEFAULT_MISSION_TIMEZONE,
    severity: input.severity ?? defaultSeverityForType(input.watchType),
    optional,
    snoozedUntil: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    lastFiredFingerprint: null,
    lastFiredAt: null,
    consentRevoked: false,
  };
  saveWatch(watch);
  return watch;
}

export function buildEvaluationContext(input: {
  missionId: string;
  participantId: string;
  actorConsentScopes?: string[];
  revokedConsentScopes?: string[];
  referenceTime?: Date;
  timeZone?: string;
}): WatchEvaluationContext {
  const plan = getMissionPlan(input.missionId);
  const planNodeStatuses: Record<string, string> = {};
  const evidenceStaleNodeIds: string[] = [];
  const unconfirmedTransportNodeIds: string[] = [];
  const pendingHumanReviewNodeIds: string[] = [];

  if (plan) {
    for (const node of plan.missionGraph.nodes) {
      planNodeStatuses[node.id] = node.status;
      if (
        node.type === "transport" &&
        node.status !== "confirmed" &&
        node.status !== "available"
      ) {
        unconfirmedTransportNodeIds.push(node.id);
      }
      if (node.type === "evidence" && node.status === "needs_review") {
        evidenceStaleNodeIds.push(node.id);
      }
      if (node.type === "human_review") {
        pendingHumanReviewNodeIds.push(node.id);
      }
    }
    for (const item of plan.evidenceBundle?.stale ?? []) {
      evidenceStaleNodeIds.push(item.id);
    }
  }

  const revoked = [
    ...(input.revokedConsentScopes ?? []),
    ...getRevokedConsentScopes(input.participantId),
  ];

  return {
    missionId: input.missionId,
    participantId: input.participantId,
    actorConsentScopes: input.actorConsentScopes ?? [],
    revokedConsentScopes: [...new Set(revoked)],
    referenceTime: input.referenceTime ?? new Date(),
    timeZone: input.timeZone ?? DEFAULT_MISSION_TIMEZONE,
    contextHints: loadContextHints(input.missionId),
    planNodeStatuses,
    evidenceStaleNodeIds: [...new Set(evidenceStaleNodeIds)],
    unconfirmedTransportNodeIds,
    pendingHumanReviewNodeIds,
  };
}

export function tickMissionWatches(input: {
  missionId: string;
  participantId: string;
  actorConsentScopes?: string[];
  revokedConsentScopes?: string[];
  referenceTime?: Date;
  ingestRecoveryEvents?: boolean;
}): MissionWatchTickResult {
  assertWatchSurfaceEnabled();
  const plan = getMissionPlan(input.missionId);
  if (!plan) throw new Error("MISSION_NOT_FOUND");

  const referenceTime = input.referenceTime ?? new Date();
  const ctx = buildEvaluationContext({
    missionId: input.missionId,
    participantId: input.participantId,
    actorConsentScopes: input.actorConsentScopes,
    revokedConsentScopes: input.revokedConsentScopes,
    referenceTime,
  });

  const watches = listEnabledWatches(input.missionId);
  const results = watches.map((w) => evaluateWatchRule(w, ctx));
  const { fired, suppressed } = partitionResults(results);

  const alertsCreated = [];
  for (const result of fired) {
    const alert = createInAppAlertFromResult(result, referenceTime);
    saveAlert(alert);
    alertsCreated.push(alert);
    const watch = getWatch(result.missionId, result.watchId);
    if (watch) {
      saveWatch({
        ...watch,
        lastFiredFingerprint: result.fingerprint,
        lastFiredAt: referenceTime.toISOString(),
        nextEvaluationAt: referenceTime.toISOString(),
        updatedAt: referenceTime.toISOString(),
      });
    }
  }

  const recoveryEventsIngested: string[] = [];
  const shouldIngest =
    input.ingestRecoveryEvents !== false &&
    adaptiveRecoveryConfig.enabled &&
    agenticNerveCentreConfig.enabled;

  if (shouldIngest) {
    ensureMissionRecoveryTracking(plan);
    for (const result of fired) {
      if (!result.recoveryEventType) continue;
      try {
        const ingest = ingestMissionEvent({
          missionId: input.missionId,
          type: result.recoveryEventType,
          source: "system_derived",
          systemRecordId: result.watchId,
          affectedNodeIds: result.affectedNodeIds,
          payload: {
            watchId: result.watchId,
            watchType: result.watchType,
            explanation: result.explanation,
            proactive: true,
            operationalActionCreated: false,
          },
          idempotencyKey: `watch:${result.fingerprint}`,
        });
        if (!ingest.duplicate) recoveryEventsIngested.push(ingest.event.eventId);
      } catch {
        /* recovery may be kill-switched; watch alerts still stand */
      }
    }
  }

  const tick: MissionWatchTickResult = {
    missionId: input.missionId,
    evaluatedAt: referenceTime.toISOString(),
    watchesEvaluated: watches.length,
    fired,
    suppressed,
    alertsCreated,
    recoveryEventsIngested,
    reassessRecommended: fired.length > 0,
    operationalActionsCreated: 0,
    aiAssistUsed: false,
  };
  recordTick(tick);
  return tick;
}

export function snoozeWatch(input: {
  missionId: string;
  watchId: string;
  minutes: number;
  referenceTime?: Date;
}): MapAbleMissionWatch {
  assertWatchSurfaceEnabled();
  const watch = getWatch(input.missionId, input.watchId);
  if (!watch) throw new Error("WATCH_NOT_FOUND");
  if (watch.severity === "critical") {
    throw new Error("CRITICAL_WATCH_CANNOT_SNOOZE");
  }
  const ref = input.referenceTime ?? new Date();
  const updated: MapAbleMissionWatch = {
    ...watch,
    snoozedUntil: new Date(ref.getTime() + input.minutes * 60_000).toISOString(),
    updatedAt: ref.toISOString(),
  };
  saveWatch(updated);
  return updated;
}

export function disableOptionalWatch(input: {
  missionId: string;
  watchId: string;
}): MapAbleMissionWatch {
  assertWatchSurfaceEnabled();
  const watch = getWatch(input.missionId, input.watchId);
  if (!watch) throw new Error("WATCH_NOT_FOUND");
  if (!watch.optional) throw new Error("WATCH_NOT_OPTIONAL");
  const updated: MapAbleMissionWatch = {
    ...watch,
    enabled: false,
    updatedAt: new Date().toISOString(),
  };
  saveWatch(updated);
  return updated;
}

export function applyParticipantWatchAction(input: {
  missionId: string;
  watchId: string;
  action: ParticipantWatchAction;
  minutes?: number;
  participantId: string;
  actorConsentScopes?: string[];
}): {
  watch: MapAbleMissionWatch | null;
  tick: MissionWatchTickResult | null;
  message: string;
} {
  assertWatchSurfaceEnabled();
  const watch = getWatch(input.missionId, input.watchId);
  if (!watch) throw new Error("WATCH_NOT_FOUND");

  switch (input.action) {
    case "snooze":
      return {
        watch: snoozeWatch({
          missionId: input.missionId,
          watchId: input.watchId,
          minutes: input.minutes ?? 60,
        }),
        tick: null,
        message: "Reminder snoozed. Nothing else changed.",
      };
    case "disable_optional":
      return {
        watch: disableOptionalWatch({
          missionId: input.missionId,
          watchId: input.watchId,
        }),
        tick: null,
        message: "Optional watch disabled.",
      };
    case "take_no_action":
      dismissLatestForWatch(input.missionId, input.watchId);
      return {
        watch,
        tick: null,
        message: "No action taken. Your plan is unchanged.",
      };
    case "reassess_now":
      return {
        watch,
        tick: tickMissionWatches({
          missionId: input.missionId,
          participantId: input.participantId,
          actorConsentScopes: input.actorConsentScopes,
          ingestRecoveryEvents: true,
        }),
        message:
          "Watch re-evaluated. If recovery is enabled, events may have been recorded for reassessment. No operational action was executed.",
      };
    case "open_evidence":
      return {
        watch,
        tick: null,
        message: "Open evidence from your mission plan. Watch did not change any records.",
      };
    case "request_human_help":
      return {
        watch,
        tick: null,
        message:
          "Human help requested as a recommendation only. Use Mission Action Review to submit a coordination request if you choose.",
      };
    default: {
      const _never: never = input.action;
      void _never;
      throw new Error("UNKNOWN_PARTICIPANT_ACTION");
    }
  }
}

function dismissLatestForWatch(missionId: string, watchId: string): void {
  const alert = listActiveAlerts(missionId).find((a) => a.watchId === watchId);
  if (alert) dismissAlert(missionId, alert.alertId);
}

export function getMissionWatchSnapshot(missionId: string): {
  watches: MapAbleMissionWatch[];
  alerts: ReturnType<typeof listActiveAlerts>;
  plan: MapAbleMissionPlan | null;
} {
  return {
    watches: listWatches(missionId),
    alerts: listActiveAlerts(missionId),
    plan: getMissionPlan(missionId),
  };
}

export function markConsentRevokedForParticipant(
  participantId: string,
  scope: string,
): void {
  revokeConsentScope(participantId, scope);
}

function assertWatchSurfaceEnabled(): void {
  if (!agenticNerveCentreConfig.enabled) {
    throw new Error("AGENTIC_NERVE_CENTRE_DISABLED");
  }
  if (!missionWatchConfig.mayEvaluateWatches) {
    throw new Error("MISSION_WATCH_DISABLED");
  }
}
