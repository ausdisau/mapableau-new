import type { AccessStatusEvent } from "@prisma/client";

import type { OperationalStatusProjection } from "../types";

import {
  freshnessDeadline,
  isOperationallyAvailable,
  isStatusFresh,
} from "./freshness";

export type StatusProjectionEvent = Pick<
  AccessStatusEvent,
  | "assetId"
  | "state"
  | "sourceType"
  | "confidence"
  | "effectiveFrom"
  | "expectedUntil"
  | "freshnessWindowSeconds"
  | "reasonCode"
>;

export function projectOperationalStatus(
  events: StatusProjectionEvent[],
  now: Date = new Date(),
): OperationalStatusProjection {
  if (events.length === 0) {
    return {
      assetId: null,
      state: "stale",
      available: false,
      stale: true,
      sourceType: null,
      confidence: 0,
      effectiveFrom: null,
      expectedUntil: null,
      freshnessDeadline: null,
      reason: "missing_status_updates",
    };
  }

  const latest = [...events].sort(
    (a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime(),
  )[0];
  const deadline = freshnessDeadline(latest);
  if (!isStatusFresh(latest, now)) {
    return {
      assetId: latest.assetId,
      state: "stale",
      available: false,
      stale: true,
      sourceType: latest.sourceType,
      confidence: latest.confidence,
      effectiveFrom: latest.effectiveFrom,
      expectedUntil: latest.expectedUntil,
      freshnessDeadline: deadline,
      reason: "freshness_exceeded",
    };
  }

  return {
    assetId: latest.assetId,
    state: latest.state,
    available: isOperationallyAvailable(latest.state),
    stale: false,
    sourceType: latest.sourceType,
    confidence: latest.confidence,
    effectiveFrom: latest.effectiveFrom,
    expectedUntil: latest.expectedUntil,
    freshnessDeadline: deadline,
    reason: latest.reasonCode,
  };
}
