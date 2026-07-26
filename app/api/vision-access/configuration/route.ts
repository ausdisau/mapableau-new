import { NextResponse } from "next/server";

import {
  VISION_AUDIT_EVENTS,
  VISION_PERMANENT_OFF_FLAGS,
  getDefaultSyntheticScene,
  isVisionSyntheticDemoAvailable,
  listVisionAccessFlagStates,
  listWave1CapturePurposes,
  visionAccessFlags,
} from "@/lib/vision-access";

/**
 * Read-only Wave 1 configuration.
 * Does not accept media, run inference, or write canonical domains.
 */
export async function GET() {
  const demoAvailable = isVisionSyntheticDemoAvailable();
  const scene = demoAvailable ? getDefaultSyntheticScene() : null;

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
    syntheticScene: scene
      ? {
          sceneId: scene.sceneId,
          placeName: scene.placeName,
          candidateCount: scene.candidates.length,
          capabilityTier: scene.device.capabilityTier,
        }
      : null,
  });
}
