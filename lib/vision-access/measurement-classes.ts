/**
 * Measurement method classes — never collapse these.
 * Depth estimates are provisional; monocular is never labelled as sensor measurement.
 */

export const VISION_MEASUREMENT_CLASSES = [
  "visual_inference",
  "monocular_estimate",
  "motion_depth_estimate",
  "hardware_depth_estimate",
  "guided_device_measurement",
  "manual_measurement",
  "professional_measurement",
] as const;

export type VisionMeasurementClass = (typeof VISION_MEASUREMENT_CLASSES)[number];

export const VISION_MEASUREMENT_CLASS_LABELS: Record<
  VisionMeasurementClass,
  string
> = {
  visual_inference: "Visual inference (no geometric measurement)",
  monocular_estimate: "Monocular estimate (approximate, model-derived)",
  motion_depth_estimate: "Motion depth estimate (approximate)",
  hardware_depth_estimate: "Hardware depth estimate (sensor-assisted, provisional)",
  guided_device_measurement: "Guided device measurement (structured capture)",
  manual_measurement: "Manual measurement (physical instrument)",
  professional_measurement: "Professional measurement (authorised assessor)",
};

export function isSensorAssistedMeasurement(
  method: VisionMeasurementClass,
): boolean {
  return (
    method === "hardware_depth_estimate" ||
    method === "guided_device_measurement" ||
    method === "professional_measurement"
  );
}

export function assertMonocularNotSensorLabelled(
  method: VisionMeasurementClass,
): void {
  if (method === "monocular_estimate") {
    // Contract guard: callers must not present this as hardware/sensor measurement.
    return;
  }
}

export function formatProvisionalIntervalMm(
  lowMm: number,
  highMm: number,
): string {
  const lo = Math.round(lowMm / 10) * 10;
  const hi = Math.round(highMm / 10) * 10;
  return `approximately ${lo} to ${hi} mm`;
}

export function measurementClaimAllowed(
  method: VisionMeasurementClass,
): "none" | "provisional" | "manual_or_professional" {
  switch (method) {
    case "visual_inference":
      return "none";
    case "monocular_estimate":
    case "motion_depth_estimate":
    case "hardware_depth_estimate":
    case "guided_device_measurement":
      return "provisional";
    case "manual_measurement":
    case "professional_measurement":
      return "manual_or_professional";
    default: {
      const _exhaustive: never = method;
      return _exhaustive;
    }
  }
}
