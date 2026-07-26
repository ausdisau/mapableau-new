/**
 * MapAble VisionAccessOS feature flags.
 * Authority / publication flags are server-only — never NEXT_PUBLIC.
 * Dangerous capabilities remain permanently off unless explicitly enabled.
 */

function envTrue(name: string): boolean {
  const v = process.env[name];
  return v === "true" || v === "1";
}

export const visionAccessFlags = {
  enabled: envTrue("MAPABLE_VISION_ACCESS_ENABLED"),
  mode: (process.env.MAPABLE_VISION_ACCESS_MODE ?? "shadow") as
    | "demo"
    | "shadow"
    | "supervised_pilot"
    | "limited_release"
    | "production",
  stopAndScan: envTrue("MAPABLE_VISION_STOP_AND_SCAN_ENABLED"),
  guidedMeasurement: envTrue("MAPABLE_VISION_GUIDED_MEASUREMENT_ENABLED"),
  mapperSurvey: envTrue("MAPABLE_VISION_MAPPER_SURVEY_ENABLED"),
  personalFit: envTrue("MAPABLE_VISION_PERSONAL_FIT_ENABLED"),
  liveAdvisory: envTrue("MAPABLE_VISION_LIVE_ADVISORY_ENABLED"),
  remoteAssistance: envTrue("MAPABLE_VISION_REMOTE_ASSISTANCE_ENABLED"),
  onDevice: envTrue("MAPABLE_VISION_ON_DEVICE_ENABLED"),
  cloudEscalation: envTrue("MAPABLE_VISION_CLOUD_ESCALATION_ENABLED"),
  depth: envTrue("MAPABLE_VISION_DEPTH_ENABLED"),
  sceneReconstruction: envTrue("MAPABLE_VISION_SCENE_RECONSTRUCTION_ENABLED"),
  ocr: envTrue("MAPABLE_VISION_OCR_ENABLED"),
  privacyRedaction: envTrue("MAPABLE_VISION_PRIVACY_REDACTION_ENABLED"),
  evidenceUpload: envTrue("MAPABLE_VISION_EVIDENCE_UPLOAD_ENABLED"),
  moderation: envTrue("MAPABLE_VISION_MODERATION_ENABLED"),
  twinComparison: envTrue("MAPABLE_VISION_TWIN_COMPARISON_ENABLED"),
  /** Synthetic Access Lens demo UI (fixtures only — no camera). */
  syntheticDemo: envTrue("MAPABLE_VISION_SYNTHETIC_DEMO_ENABLED"),
  /**
   * Permanent prohibitions — hard-coded false regardless of env
   * (defence in depth; client/env cannot enable these).
   */
  faceIdentification: false,
  biometricAnalysis: false,
  disabilityInference: false,
  backgroundRecording: false,
  autoPublish: false,
  autoRouteClosure: false,
  autoNavigation: false,
  physicalActions: false,
} as const;

export type VisionAccessFlagKey = keyof typeof visionAccessFlags;

export function listVisionAccessFlagStates(): Record<
  VisionAccessFlagKey,
  boolean | string
> {
  const out = {} as Record<VisionAccessFlagKey, boolean | string>;
  for (const key of Object.keys(visionAccessFlags) as VisionAccessFlagKey[]) {
    out[key] = visionAccessFlags[key];
  }
  return out;
}

/** Permanent-off flags that must never be treated as safe to enable via client. */
export const VISION_PERMANENT_OFF_FLAGS: readonly VisionAccessFlagKey[] = [
  "faceIdentification",
  "biometricAnalysis",
  "disabilityInference",
  "backgroundRecording",
  "autoPublish",
  "autoRouteClosure",
  "autoNavigation",
  "physicalActions",
] as const;

export function assertDangerousVisionFlagsOff(): void {
  for (const key of VISION_PERMANENT_OFF_FLAGS) {
    if (visionAccessFlags[key] === true) {
      throw new Error(
        `VISION_DANGEROUS_FLAG_ENABLED:${key} — refuse to proceed while this flag is true`,
      );
    }
  }
}

/** Wave 1: synthetic demo is available when master flag or syntheticDemo is on, or in test/demo. */
export function isVisionSyntheticDemoAvailable(): boolean {
  if (process.env.NODE_ENV === "test") return true;
  if (process.env.MAPABLE_VISION_DEMO === "true") return true;
  return visionAccessFlags.enabled || visionAccessFlags.syntheticDemo;
}
