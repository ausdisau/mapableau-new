import type { AccessStatusEvent } from "@prisma/client";

import { isOperationallyAvailable } from "./freshness";

export type ConflictCandidate = Pick<
  AccessStatusEvent,
  "assetId" | "state" | "sourceType" | "effectiveFrom" | "confidence"
>;

export interface StatusConflictResult {
  conflict: boolean;
  assetId: string | null;
  sensorState: string | null;
  operatorState: string | null;
  reason: string;
}

export function detectSensorOperatorConflict(
  events: ConflictCandidate[],
  windowMinutes = 30,
): StatusConflictResult {
  const sorted = [...events].sort(
    (a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime(),
  );
  const sensor = sorted.find((event) => event.sourceType === "sensor");
  const operator = sorted.find((event) => event.sourceType === "operator");
  if (!sensor || !operator) {
    return {
      conflict: false,
      assetId: null,
      sensorState: null,
      operatorState: null,
      reason: "missing_pair",
    };
  }
  const diff = Math.abs(
    sensor.effectiveFrom.getTime() - operator.effectiveFrom.getTime(),
  );
  if (diff > windowMinutes * 60 * 1000) {
    return {
      conflict: false,
      assetId: sensor.assetId,
      sensorState: sensor.state,
      operatorState: operator.state,
      reason: "outside_window",
    };
  }
  const conflict =
    isOperationallyAvailable(sensor.state) !==
    isOperationallyAvailable(operator.state);
  return {
    conflict,
    assetId: sensor.assetId,
    sensorState: sensor.state,
    operatorState: operator.state,
    reason: conflict
      ? "sensor_operator_availability_mismatch"
      : "states_compatible",
  };
}
