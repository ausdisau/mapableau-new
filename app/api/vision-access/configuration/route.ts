import { NextResponse } from "next/server";

import {
  VISION_AUDIT_EVENTS,
  VISION_PERMANENT_OFF_FLAGS,
  assertDangerousVisionFlagsOff,
  getDefaultSyntheticScene,
  isVisionSyntheticDemoAvailable,
  listVisionAccessFlagStates,
  listWave1CapturePurposes,
  visionAccessFlags,
} from "@/lib/vision-access";

/**
 * Read-only Wave 1 configuration.
 * Does not accept media, run inference, or write canonical domains.
 * Available only when synthetic demo flags allow (or MAPABLE_VISION_DEMO=true).
 */
export async function GET() {
  try {
    assertDangerousVisionFlagsOff();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "VISION_DANGEROUS_FLAG_ENABLED";
    return NextResponse.json(
      {
        error: "dangerous_flag_enabled",
        message,
      },
      { status: 503 },
    );
  }

  if (!isVisionSyntheticDemoAvailable()) {
    return NextResponse.json(
      {
        error: "vision_access_unavailable",
        message:
          "VisionAccess Wave 1 configuration requires MAPABLE_VISION_ACCESS_ENABLED, MAPABLE_VISION_SYNTHETIC_DEMO_ENABLED, or MAPABLE_VISION_DEMO=true.",
        cameraEnabled: false,
        uploadEnabled: false,
        flags: listVisionAccessFlagStates(),
        permanentOffFlags: VISION_PERMANENT_OFF_FLAGS,
      },
      { status: 404 },
    );
  }

  const scene = getDefaultSyntheticScene();

  return NextResponse.json({
    product: "MapAble Access Lens",
    platform: "VisionAccessOS",
    wave: 1,
    cameraEnabled: false,
    nativeBridgeConnected: false,
    uploadEnabled: false,
    liveAdvisoryEnabled: false,
    flags: listVisionAccessFlagStates(),
    permanentOffFlags: VISION_PERMANENT_OFF_FLAGS,
    capturePurposesWave1: listWave1CapturePurposes(),
    auditEventNames: VISION_AUDIT_EVENTS,
    mode: visionAccessFlags.mode,
    syntheticScene: {
      sceneId: scene.sceneId,
      placeName: scene.placeName,
      candidateCount: scene.candidates.length,
      capabilityTier: scene.device.capabilityTier,
    },
  });
}
