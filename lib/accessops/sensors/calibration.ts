import type { AccessSensorCalibrationStatus } from "@prisma/client";

export function projectCalibrationStatus(
  nextCalibrationAt: Date | null,
  now: Date = new Date(),
): AccessSensorCalibrationStatus {
  if (!nextCalibrationAt) return "unknown";
  return nextCalibrationAt.getTime() < now.getTime() ? "overdue" : "calibrated";
}
