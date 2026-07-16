/**
 * Public type surface for MapAble VisionAccessOS / Access Lens.
 * Implementation lives in lib/vision-access.
 */

export type {
  VisionCapturePurpose,
  VisionCapturePurposeDefinition,
  VisionFeatureClass,
  VisionHazardClass,
  VisionMeasurementClass,
  VisionCandidateState,
  VisionParticipantFacingState,
  VisionConfidenceDimensions,
  VisionDeviceCapabilityProfile,
  VisionDeviceTier,
  PerceptionCandidate,
  GeometryEstimate,
  HazardCandidate,
  FeatureCandidate,
  EvidenceBundle,
  FrameQualityResult,
  SyntheticScene,
  VisionAuditEventName,
} from "@/lib/vision-access";

export {
  VISION_ACCESS_DISCLAIMER,
  VISION_ACCESS_TRUST_NOTE,
  VISION_FEATURE_LABELS,
  VISION_HAZARD_LABELS,
  VISION_PARTICIPANT_STATE_LABELS,
  VISION_MEASUREMENT_CLASS_LABELS,
  VISION_CANDIDATE_STATES,
  VISION_AUDIT_EVENTS,
} from "@/lib/vision-access";
