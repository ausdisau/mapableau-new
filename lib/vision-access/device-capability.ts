/**
 * Runtime device capability ladder (Levels 0–6).
 * Never infer capability from marketing model names alone.
 */

export const VISION_DEVICE_TIERS = [0, 1, 2, 3, 4, 5, 6] as const;

export type VisionDeviceTier = (typeof VISION_DEVICE_TIERS)[number];

export const VISION_DEVICE_TIER_LABELS: Record<VisionDeviceTier, string> = {
  0: "Manual only",
  1: "Camera and OCR",
  2: "On-device 2D vision",
  3: "Motion-based depth",
  4: "Hardware-assisted depth",
  5: "Scene reconstruction",
  6: "External calibrated sensor",
};

export type VisionDeviceCapabilityProfile = {
  platform: "ios" | "android" | "web" | "simulator" | "unknown";
  osVersion: string | null;
  modelIdentifier: string | null;
  cameraSupported: boolean;
  cameraPermission: "granted" | "denied" | "prompt" | "unavailable" | "not_requested";
  depthSupport: "none" | "motion" | "hardware" | "unknown";
  sceneReconstructionSupport: boolean;
  supportedOrientations: ("portrait" | "landscape")[];
  modelRuntime: "none" | "core_ml" | "litert" | "ml_kit" | "mediapipe" | "browser" | "simulator";
  computeBackend: "cpu" | "gpu" | "npu" | "unknown" | "none";
  thermalState: "nominal" | "fair" | "serious" | "critical" | "unknown";
  batteryState: "unknown" | "charging" | "discharging" | "full" | "low";
  accessibilitySettings: {
    screenReader: boolean | null;
    reduceMotion: boolean | null;
    boldText: boolean | null;
    largerText: boolean | null;
  };
  calibrationStatus: "not_calibrated" | "platform_reported" | "user_reference" | "validated_lab";
  capabilityTier: VisionDeviceTier;
  recheckAfter: string | null;
  limitations: string[];
};

export function syntheticDemoDeviceProfile(): VisionDeviceCapabilityProfile {
  return {
    platform: "simulator",
    osVersion: null,
    modelIdentifier: "vision-access-synthetic-demo",
    cameraSupported: false,
    cameraPermission: "not_requested",
    depthSupport: "none",
    sceneReconstructionSupport: false,
    supportedOrientations: ["portrait", "landscape"],
    modelRuntime: "simulator",
    computeBackend: "none",
    thermalState: "nominal",
    batteryState: "unknown",
    accessibilitySettings: {
      screenReader: null,
      reduceMotion: null,
      boldText: null,
      largerText: null,
    },
    calibrationStatus: "not_calibrated",
    capabilityTier: 0,
    recheckAfter: null,
    limitations: [
      "Synthetic demo only — no camera, no depth, no on-device inference.",
      "Candidates are fixtures for UX and contract validation.",
    ],
  };
}

export function resolveCapabilityTier(
  profile: Pick<
    VisionDeviceCapabilityProfile,
    | "cameraSupported"
    | "cameraPermission"
    | "depthSupport"
    | "sceneReconstructionSupport"
    | "modelRuntime"
  >,
): VisionDeviceTier {
  if (!profile.cameraSupported || profile.cameraPermission === "denied") {
    return 0;
  }
  if (profile.sceneReconstructionSupport && profile.depthSupport === "hardware") {
    return 5;
  }
  if (profile.depthSupport === "hardware") {
    return 4;
  }
  if (profile.depthSupport === "motion") {
    return 3;
  }
  if (
    profile.modelRuntime === "core_ml" ||
    profile.modelRuntime === "litert" ||
    profile.modelRuntime === "mediapipe" ||
    profile.modelRuntime === "ml_kit"
  ) {
    return 2;
  }
  if (profile.cameraPermission === "granted") {
    return 1;
  }
  return 0;
}
