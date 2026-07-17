import { buildTaylorCommunicationDevicePassport } from "@/lib/at-lifecycle-os";
import { projectCommunicationPassport } from "@/lib/communications-os";
import {
  CONNECTED_CAPABILITY_SOURCE_VERSION,
  type MobileCapabilityProfile,
  type OfflineMissionPack,
} from "@/lib/connected-capability";
import { taylorAccessibilityProfile } from "@/lib/connected-capability/taylor-fixture";

export const COMPANION_ARCHITECTURE = {
  framework: "react_native_expo",
  delivery: "android_first",
  iosStrategy: "eas_cloud_macos_builds",
  webViewShell: false,
  draftbitPrimaryOwnership: false,
  nativeModuleBoundaries: [
    "camera",
    "depth",
    "secure_storage",
    "notifications",
  ],
  noSmartphoneAlternative: "essential_web_fallback_not_companion",
  continuousLocation: false,
  backgroundRecording: false,
  localStorageUnrestricted: false,
} as const;

export function getMobileCapabilityProfile(): MobileCapabilityProfile {
  return {
    platform: "android",
    secureStorage: true,
    offlineDatabase: true,
    pushNotifications: true,
    camera: true,
    continuousLocation: false,
    backgroundRecording: false,
  };
}

/**
 * Offline Visit Pack for Companion first slice.
 * Encrypted secure storage required — not plain localStorage.
 */
export function buildTaylorVisitPack(): OfflineMissionPack {
  const passport = projectCommunicationPassport(taylorAccessibilityProfile, {
    participantId: "fixture-taylor-participant",
    isSynthetic: true,
  });
  const equipment = buildTaylorCommunicationDevicePassport();
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

  return {
    id: "fixture-taylor-visit-pack",
    participantId: "fixture-taylor-participant",
    missionRef: "case:harbour-civic-induction-day1",
    communicationPassportSummary: {
      state: passport.state,
      instructions: passport.participantAuthoredInstructions,
      oneQuestionAtATime: true,
      responseTimeMinimumSeconds: 20,
    },
    careAndTransport: {
      transport: "power_chair_compatible_required",
      entrance: "step_free_door_to_room",
      destination: "Harbour Civic Centre induction room",
      returnTransportRisk: "may_cancel_simulate",
    },
    equipmentSignals: [equipment.continuity],
    issuedAt,
    expiresAt,
    encryptedPayloadHint: "secure_store_required",
    isSynthetic: true,
  };
}

export function companionSourceVersion() {
  return CONNECTED_CAPABILITY_SOURCE_VERSION;
}
