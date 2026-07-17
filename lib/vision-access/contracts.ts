/**
 * Shared VisionAccess TypeScript contracts (Wave 1).
 * No Prisma persistence. Geometry estimates are always provisional schemas.
 */

import type { VisionCandidateState } from "./candidate-state-machine";
import type { VisionCapturePurpose } from "./capture-purposes";
import type { VisionConfidenceDimensions, VisionParticipantFacingState } from "./confidence";
import type { VisionDeviceCapabilityProfile } from "./device-capability";
import type { VisionMeasurementClass } from "./measurement-classes";
import type { VisionFeatureClass, VisionHazardClass } from "./taxonomy";

export type FrameQualityOutcome =
  | "usable"
  | "usable_with_limitations"
  | "recapture_recommended"
  | "unsupported"
  | "human_review_required";

export type FrameQualityResult = {
  outcome: FrameQualityOutcome;
  blur: "ok" | "soft" | "severe" | "unknown";
  exposure: "ok" | "dark" | "bright" | "unknown";
  glare: boolean | null;
  occlusion: boolean | null;
  cameraMotion: "steady" | "moving" | "unknown";
  framing: "ok" | "partial" | "poor" | "unknown";
  depthCoverage: "none" | "partial" | "full" | "unknown";
  notes: string[];
};

export type BoundingRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PerceptionCandidate = {
  id: string;
  kind: "feature" | "hazard" | "ocr" | "geometry_context";
  featureClass?: VisionFeatureClass;
  hazardClass?: VisionHazardClass;
  label: string;
  description: string;
  participantFacingState: VisionParticipantFacingState;
  state: VisionCandidateState;
  source:
    | "deterministic_fixture"
    | "local_on_device"
    | "cloud_model"
    | "participant_marked";
  boundingRegion?: BoundingRegion;
  confidence: VisionConfidenceDimensions;
  /** Hard invariant: automated results are never exact measurements. */
  exactMeasurementAvailable: false;
  requiresHumanConfirmation: true;
  ocrText?: string;
  capturePurpose: VisionCapturePurpose;
  createdAt: string;
  listPriority: number;
};

export type GeometryEstimate = {
  id: string;
  target: "clear_width" | "threshold_height" | "slope" | "distance" | "corridor_width" | "other";
  method: VisionMeasurementClass;
  /** Prefer intervals; avoid false precision. */
  valueLow: number | null;
  valueHigh: number | null;
  unit: "mm" | "m" | "percent" | "degrees" | "ratio" | null;
  displayLabel: string;
  deviceCapabilityTier: number;
  frameCount: number;
  confidenceMapCoverage: number | null;
  calibrationStatus: VisionDeviceCapabilityProfile["calibrationStatus"];
  conditions: string[];
  manualConfirmation: boolean;
  /** Always provisional unless professional/manual with provenance. */
  provisional: true;
  notACertifiedMeasurement: true;
};

export type HazardCandidate = PerceptionCandidate & {
  kind: "hazard";
  hazardClass: VisionHazardClass;
};

export type FeatureCandidate = PerceptionCandidate & {
  kind: "feature";
  featureClass: VisionFeatureClass;
};

export type PrivacyRedactionManifest = {
  facesRedacted: boolean;
  platesRedacted: boolean;
  documentsRedacted: boolean;
  screensRedacted: boolean;
  manualCropApplied: boolean;
  identityMatchingPerformed: false;
};

export type EvidenceBundle = {
  bundleId: string;
  capturePurpose: VisionCapturePurpose;
  contributorReference: string | null;
  deviceCapability: VisionDeviceCapabilityProfile;
  applicationVersion: string;
  modelVersions: string[];
  frameQuality: FrameQualityResult | null;
  captureTime: string;
  locationPrecision: "none" | "approximate" | "precise";
  locationPermissionGranted: boolean;
  mediaReferences: string[];
  privacyRedaction: PrivacyRedactionManifest;
  perceptionCandidates: PerceptionCandidate[];
  geometryEstimates: GeometryEstimate[];
  participantAnnotations: string[];
  sourceClassification:
    | "synthetic_fixture"
    | "participant_observation"
    | "device_assisted"
    | "manual_measurement"
    | "community_observation";
  rightsPolicy: string;
  retention: "none" | "ephemeral" | "session" | "participant_selected";
  integrityHash: string | null;
  deletionState: "not_applicable" | "active" | "pending" | "deleted";
  /** Integrity of package ≠ truth of accessibility claim. */
  provesClaimTruth: false;
};

export type CaptureInstruction = {
  id: string;
  code:
    | "hold_steady"
    | "move_closer"
    | "move_farther"
    | "sweep_slowly"
    | "include_floor"
    | "include_door_edges"
    | "include_ramp_start_landing"
    | "avoid_glare"
    | "capture_another_angle"
    | "depth_unavailable"
    | "low_light"
    | "object_occluded"
    | "stop_before_review";
  message: string;
  channels: ("visual" | "text" | "spoken" | "haptic")[];
};

export type SyntheticScene = {
  sceneId: string;
  placeName: string;
  placeSlug: string;
  title: string;
  description: string;
  capturePurpose: VisionCapturePurpose;
  device: VisionDeviceCapabilityProfile;
  frameQuality: FrameQualityResult;
  candidates: PerceptionCandidate[];
  geometryEstimates: GeometryEstimate[];
  disclaimer: string;
  safetyNotes: string[];
};
