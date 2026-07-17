import type { AccessOperationalState } from "@prisma/client";

import {
  ACCESSOPS_RELIABILITY_CALCULATION_VERSION,
  type MinuteStatusBucket,
  type ReliabilityWindowResult,
} from "../types";

function isVerifiedAvailable(state: AccessOperationalState): boolean {
  return state === "reported_available" || state === "verified_available";
}

function isDegraded(state: AccessOperationalState): boolean {
  return state === "degraded" || state === "partially_available";
}

function isUnavailable(state: AccessOperationalState): boolean {
  return (
    state === "temporarily_unavailable" ||
    state === "under_maintenance" ||
    state === "permanently_removed" ||
    state === "status_conflict"
  );
}

export function calculateReliabilityWindow(
  buckets: MinuteStatusBucket[],
): ReliabilityWindowResult {
  let expectedAvailableMinutes = 0;
  let verifiedAvailableMinutes = 0;
  let degradedMinutes = 0;
  let unavailableMinutes = 0;
  let unknownMinutes = 0;
  let scheduledMaintenanceMinutes = 0;
  let evidenceMinutes = 0;
  const outageDurations: number[] = [];
  let activeOutage = 0;

  for (const bucket of buckets) {
    const minutes = Math.max(0, bucket.minutes);
    if (bucket.expected !== false) expectedAvailableMinutes += minutes;
    if (bucket.evidencePresent) evidenceMinutes += minutes;
    if (isVerifiedAvailable(bucket.state)) {
      verifiedAvailableMinutes += minutes;
      if (activeOutage > 0) {
        outageDurations.push(activeOutage);
        activeOutage = 0;
      }
      continue;
    }
    if (isDegraded(bucket.state)) {
      degradedMinutes += minutes;
      continue;
    }
    if (bucket.state === "scheduled_unavailable" || bucket.scheduled) {
      scheduledMaintenanceMinutes += minutes;
      continue;
    }
    if (isUnavailable(bucket.state)) {
      unavailableMinutes += minutes;
      activeOutage += minutes;
      continue;
    }
    unknownMinutes += minutes;
  }
  if (activeOutage > 0) outageDurations.push(activeOutage);

  const coveredMinutes = Math.max(0, expectedAvailableMinutes - unknownMinutes);
  const meanRestoreMinutes =
    outageDurations.length > 0
      ? outageDurations.reduce((sum, minutes) => sum + minutes, 0) /
        outageDurations.length
      : null;
  const longestOutageMinutes =
    outageDurations.length > 0 ? Math.max(...outageDurations) : null;

  return {
    expectedAvailableMinutes,
    verifiedAvailableMinutes,
    degradedMinutes,
    unavailableMinutes,
    unknownMinutes,
    scheduledMaintenanceMinutes,
    unplannedOutageCount: outageDurations.length,
    meanRestoreMinutes,
    longestOutageMinutes,
    statusCoveragePercent:
      expectedAvailableMinutes === 0
        ? 0
        : coveredMinutes / expectedAvailableMinutes,
    evidenceCompleteness:
      expectedAvailableMinutes === 0
        ? 0
        : evidenceMinutes / expectedAvailableMinutes,
    calculationVersion: ACCESSOPS_RELIABILITY_CALCULATION_VERSION,
  };
}
