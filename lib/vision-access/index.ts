export {
  visionAccessFlags,
  listVisionAccessFlagStates,
  assertDangerousVisionFlagsOff,
  isVisionSyntheticDemoAvailable,
  VISION_PERMANENT_OFF_FLAGS,
  type VisionAccessFlagKey,
} from "./feature-flags";

export {
  VISION_AUDIT_EVENTS,
  type VisionAuditEventName,
  type VisionAuditSafeSummary,
} from "./audit-events";

export {
  VISION_FEATURE_CLASSES,
  VISION_HAZARD_CLASSES,
  VISION_FEATURE_LABELS,
  VISION_HAZARD_LABELS,
  VISION_PILOT_ALLOWLIST,
  VISION_PROHIBITED_OUTPUTS,
  type VisionFeatureClass,
  type VisionHazardClass,
  type VisionProhibitedOutput,
} from "./taxonomy";

export {
  VISION_CAPTURE_PURPOSES,
  VISION_CAPTURE_PURPOSE_REGISTRY,
  getCapturePurpose,
  listWave1CapturePurposes,
  type VisionCapturePurpose,
  type VisionCapturePurposeDefinition,
} from "./capture-purposes";

export {
  VISION_MEASUREMENT_CLASSES,
  VISION_MEASUREMENT_CLASS_LABELS,
  isSensorAssistedMeasurement,
  formatProvisionalIntervalMm,
  measurementClaimAllowed,
  type VisionMeasurementClass,
} from "./measurement-classes";

export {
  emptyConfidenceDimensions,
  participantStateFromFixture,
  VISION_PARTICIPANT_STATES,
  VISION_PARTICIPANT_STATE_LABELS,
  type VisionConfidenceDimensions,
  type VisionParticipantFacingState,
} from "./confidence";

export {
  syntheticDemoDeviceProfile,
  resolveCapabilityTier,
  VISION_DEVICE_TIER_LABELS,
  type VisionDeviceCapabilityProfile,
  type VisionDeviceTier,
} from "./device-capability";

export {
  VISION_CANDIDATE_STATES,
  canTransitionCandidate,
  assertCandidateTransition,
  transitionCandidate,
  isForbiddenElevation,
  nextStates,
  type VisionCandidateState,
} from "./candidate-state-machine";

export type {
  FrameQualityResult,
  FrameQualityOutcome,
  PerceptionCandidate,
  GeometryEstimate,
  HazardCandidate,
  FeatureCandidate,
  EvidenceBundle,
  PrivacyRedactionManifest,
  CaptureInstruction,
  SyntheticScene,
  BoundingRegion,
} from "./contracts";

export {
  harbourCivicEntranceScene,
  harbourCivicEntranceCandidates,
  SYNTHETIC_SCENES,
  getSyntheticScene,
  getDefaultSyntheticScene,
  getSortedCandidates,
  buildSyntheticEvidenceBundle,
} from "./fixtures";

export {
  VISION_ACCESS_PRODUCT_NAME,
  VISION_ACCESS_OS_NAME,
  VISION_ACCESS_TRUST_NOTE,
  VISION_ACCESS_DISCLAIMER,
  VISION_ACCESS_MEASUREMENT_LIMITATION,
  VISION_ACCESS_NO_NAVIGATION,
  VISION_ACCESS_SYNTHETIC_BANNER,
  visionAccessHeroCopy,
  visionAccessHowItWorksSteps,
  visionAccessPrivacyBullets,
  visionAccessBuiltForA11yCopy,
} from "./copy";
