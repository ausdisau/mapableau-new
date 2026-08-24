/**
 * In-app alerts only. External notifications require Governed Action Kernel.
 */

import { randomUUID } from "node:crypto";

import { watchTypeLabel } from "./registry";
import type { InAppWatchAlert, WatchRuleResult } from "./types";

export function createInAppAlertFromResult(
  result: WatchRuleResult,
  createdAt: Date,
): InAppWatchAlert {
  return {
    alertId: randomUUID(),
    watchId: result.watchId,
    missionId: result.missionId,
    watchType: result.watchType,
    bucket: result.bucket,
    severity: result.severity,
    title: watchTypeLabel(result.watchType),
    body: result.explanation,
    recommendation: result.recommendation,
    fingerprint: result.fingerprint,
    createdAt: createdAt.toISOString(),
    dismissed: false,
    participantActions: result.participantActions,
    externalNotificationSent: false,
  };
}

export function assertNoExternalNotification(alert: InAppWatchAlert): void {
  if (alert.externalNotificationSent) {
    throw new Error("EXTERNAL_NOTIFICATION_FORBIDDEN_IN_MISSION_WATCH");
  }
}

export const NOTIFICATION_BOUNDARY = {
  inAppAllowed: true,
  emailAllowed: false,
  smsAllowed: false,
  pushAllowed: false,
  governedActionKernelRequiredForExternal: true,
} as const;
