import { emptyConfidenceDimensions, participantStateFromFixture } from "./confidence";
import type {
  EvidenceBundle,
  GeometryEstimate,
  PerceptionCandidate,
  SyntheticScene,
} from "./contracts";
import {
  VISION_ACCESS_DISCLAIMER,
  VISION_ACCESS_MEASUREMENT_LIMITATION,
  VISION_ACCESS_NO_NAVIGATION,
} from "./copy";
import { syntheticDemoDeviceProfile } from "./device-capability";

const NOW = "2026-07-16T10:00:00.000Z";

function fixtureConfidence(detection: number) {
  return {
    ...emptyConfidenceDimensions(),
    modelDetection: detection,
    classification: detection,
    frameQuality: 0.85,
    sourceCredibility: 0.2,
    freshness: 1,
    moderationState: "none" as const,
  };
}

export const harbourCivicEntranceCandidates: PerceptionCandidate[] = [
  {
    id: "fix-entrance-b",
    kind: "feature",
    featureClass: "entrance_candidate",
    label: "Entrance B candidate",
    description:
      "Possible doorway at Harbour Civic Centre Entrance B. Provisional visual candidate only.",
    participantFacingState: participantStateFromFixture({ detectionConfidence: 0.78 }),
    state: "participant_review",
    source: "deterministic_fixture",
    boundingRegion: { x: 0.28, y: 0.22, width: 0.44, height: 0.55 },
    confidence: fixtureConfidence(0.78),
    exactMeasurementAvailable: false,
    requiresHumanConfirmation: true,
    capturePurpose: "vision.synthetic_demo",
    createdAt: NOW,
    listPriority: 1,
  },
  {
    id: "fix-temp-barrier",
    kind: "hazard",
    hazardClass: "temporary_barrier",
    label: "Temporary barrier candidate",
    description:
      "Possible temporary barrier across the entrance path. May be cones, fencing or furniture.",
    participantFacingState: participantStateFromFixture({ detectionConfidence: 0.66 }),
    state: "participant_review",
    source: "deterministic_fixture",
    boundingRegion: { x: 0.32, y: 0.58, width: 0.4, height: 0.22 },
    confidence: fixtureConfidence(0.66),
    exactMeasurementAvailable: false,
    requiresHumanConfirmation: true,
    capturePurpose: "vision.synthetic_demo",
    createdAt: NOW,
    listPriority: 2,
  },
  {
    id: "fix-path-occlusion",
    kind: "feature",
    featureClass: "blocked_pathway",
    label: "Partial path occlusion",
    description:
      "Pathway appears partially occluded in the scanned area. Absence of other detections is not proof the path is clear.",
    participantFacingState: participantStateFromFixture({ detectionConfidence: 0.55 }),
    state: "participant_review",
    source: "deterministic_fixture",
    boundingRegion: { x: 0.18, y: 0.62, width: 0.64, height: 0.28 },
    confidence: fixtureConfidence(0.55),
    exactMeasurementAvailable: false,
    requiresHumanConfirmation: true,
    capturePurpose: "vision.synthetic_demo",
    createdAt: NOW,
    listPriority: 3,
  },
  {
    id: "fix-step-shadow",
    kind: "hazard",
    hazardClass: "step",
    label: "Possible step (low confidence)",
    description:
      "A shadow or level change may resemble a step. Capture another angle before acting on this candidate.",
    participantFacingState: participantStateFromFixture({ detectionConfidence: 0.32 }),
    state: "low_confidence",
    source: "deterministic_fixture",
    boundingRegion: { x: 0.4, y: 0.72, width: 0.28, height: 0.1 },
    confidence: fixtureConfidence(0.32),
    exactMeasurementAvailable: false,
    requiresHumanConfirmation: true,
    capturePurpose: "vision.synthetic_demo",
    createdAt: NOW,
    listPriority: 4,
  },
  {
    id: "fix-doorway",
    kind: "feature",
    featureClass: "hinged_door",
    label: "Doorway candidate",
    description:
      "Hinged door candidate. Clear opening width is not established from this fixture.",
    participantFacingState: participantStateFromFixture({ detectionConfidence: 0.71 }),
    state: "participant_review",
    source: "deterministic_fixture",
    boundingRegion: { x: 0.34, y: 0.2, width: 0.32, height: 0.58 },
    confidence: fixtureConfidence(0.71),
    exactMeasurementAvailable: false,
    requiresHumanConfirmation: true,
    capturePurpose: "vision.synthetic_demo",
    createdAt: NOW,
    listPriority: 5,
  },
];

/** Geometry shown only to demonstrate provisional labelling — method is visual_inference. */
export const harbourCivicGeometryEstimates: GeometryEstimate[] = [
  {
    id: "geo-door-width-unavailable",
    target: "clear_width",
    method: "visual_inference",
    valueLow: null,
    valueHigh: null,
    unit: null,
    displayLabel: VISION_ACCESS_MEASUREMENT_LIMITATION,
    deviceCapabilityTier: 0,
    frameCount: 0,
    confidenceMapCoverage: null,
    calibrationStatus: "not_calibrated",
    conditions: ["synthetic_fixture", "no_depth", "no_calibration"],
    manualConfirmation: false,
    provisional: true,
    notACertifiedMeasurement: true,
  },
];

export const harbourCivicEntranceScene: SyntheticScene = {
  sceneId: "harbour-civic-entrance-b",
  placeName: "Harbour Civic Centre",
  placeSlug: "harbour-civic-centre",
  title: "Entrance B — stop-and-scan fixture",
  description:
    "Taylor stops outside Harbour Civic Centre and reviews provisional candidates for Entrance B. This scene is synthetic: no camera is used.",
  capturePurpose: "vision.synthetic_demo",
  device: syntheticDemoDeviceProfile(),
  frameQuality: {
    outcome: "usable_with_limitations",
    blur: "ok",
    exposure: "ok",
    glare: false,
    occlusion: true,
    cameraMotion: "steady",
    framing: "partial",
    depthCoverage: "none",
    notes: [
      "Fixture frame quality only.",
      "Depth coverage unavailable on capability tier 0.",
    ],
  },
  candidates: harbourCivicEntranceCandidates,
  geometryEstimates: harbourCivicGeometryEstimates,
  disclaimer: VISION_ACCESS_DISCLAIMER,
  safetyNotes: [
    VISION_ACCESS_NO_NAVIGATION,
    "No obstacle detection does not mean the route is safe.",
    "A detected barrier does not automatically create a public incident.",
    "Candidates require participant confirmation before any submission path.",
  ],
};

export const SYNTHETIC_SCENES: SyntheticScene[] = [harbourCivicEntranceScene];

export function getSyntheticScene(sceneId: string): SyntheticScene | undefined {
  return SYNTHETIC_SCENES.find((s) => s.sceneId === sceneId);
}

export function getDefaultSyntheticScene(): SyntheticScene {
  return harbourCivicEntranceScene;
}

export function getSortedCandidates(
  candidates: PerceptionCandidate[] = harbourCivicEntranceCandidates,
): PerceptionCandidate[] {
  return [...candidates].sort((a, b) => a.listPriority - b.listPriority);
}

/** Demo evidence bundle — not signed, not uploadable, proves integrity field only as null. */
export function buildSyntheticEvidenceBundle(
  scene: SyntheticScene = harbourCivicEntranceScene,
): EvidenceBundle {
  return {
    bundleId: `synthetic-bundle-${scene.sceneId}`,
    capturePurpose: scene.capturePurpose,
    contributorReference: null,
    deviceCapability: scene.device,
    applicationVersion: "vision-access-wave1",
    modelVersions: ["deterministic_fixture@1"],
    frameQuality: scene.frameQuality,
    captureTime: NOW,
    locationPrecision: "none",
    locationPermissionGranted: false,
    mediaReferences: [],
    privacyRedaction: {
      facesRedacted: true,
      platesRedacted: true,
      documentsRedacted: true,
      screensRedacted: true,
      manualCropApplied: false,
      identityMatchingPerformed: false,
    },
    perceptionCandidates: scene.candidates,
    geometryEstimates: scene.geometryEstimates,
    participantAnnotations: [],
    sourceClassification: "synthetic_fixture",
    rightsPolicy: "vision.synthetic_demo",
    retention: "none",
    integrityHash: null,
    deletionState: "not_applicable",
    provesClaimTruth: false,
  };
}
