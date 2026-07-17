import type {
  AccessReliabilityMeasurement,
  AccessReliabilityProfile,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

import type { JsonObject, MinuteStatusBucket } from "../types";

import { calculateReliabilityWindow } from "./availability-windows";

export async function createReliabilityProfile(input: {
  assetId: string;
  measurementWindow: string;
  expectedOperatingSchedule: JsonObject;
  policyVersion: string;
  availabilityTarget?: number | null;
  reportingCompletenessTarget?: number | null;
}): Promise<AccessReliabilityProfile> {
  const schedule = asJson(input.expectedOperatingSchedule);
  if (!schedule) throw new Error("EXPECTED_OPERATING_SCHEDULE_REQUIRED");
  return prisma.accessReliabilityProfile.create({
    data: {
      assetId: input.assetId,
      measurementWindow: input.measurementWindow,
      expectedOperatingSchedule: schedule,
      policyVersion: input.policyVersion,
      availabilityTarget: input.availabilityTarget ?? null,
      reportingCompletenessTarget: input.reportingCompletenessTarget ?? null,
    },
  });
}

export async function recordReliabilityMeasurement(input: {
  assetId: string;
  windowStart: Date;
  windowEnd: Date;
  buckets: MinuteStatusBucket[];
}): Promise<AccessReliabilityMeasurement> {
  const result = calculateReliabilityWindow(input.buckets);
  return prisma.accessReliabilityMeasurement.create({
    data: {
      assetId: input.assetId,
      windowStart: input.windowStart,
      windowEnd: input.windowEnd,
      expectedAvailableMinutes: result.expectedAvailableMinutes,
      verifiedAvailableMinutes: result.verifiedAvailableMinutes,
      degradedMinutes: result.degradedMinutes,
      unavailableMinutes: result.unavailableMinutes,
      unknownMinutes: result.unknownMinutes,
      scheduledMaintenanceMinutes: result.scheduledMaintenanceMinutes,
      unplannedOutageCount: result.unplannedOutageCount,
      meanRestoreMinutes: result.meanRestoreMinutes,
      longestOutageMinutes: result.longestOutageMinutes,
      statusCoveragePercent: result.statusCoveragePercent,
      evidenceCompleteness: result.evidenceCompleteness,
      calculationVersion: result.calculationVersion,
    },
  });
}
