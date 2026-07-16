/**
 * VisionAccess audit event name constants.
 * Wave 1 defines names only — no production emission of media payloads.
 */

export const VISION_AUDIT_EVENTS = {
  sessionStarted: "vision.session_started",
  sessionStopped: "vision.session_stopped",
  sessionDiscarded: "vision.session_discarded",
  frameQualityEvaluated: "vision.frame_quality_evaluated",
  privacyRedactionApplied: "vision.privacy_redaction_applied",
  inferenceCompleted: "vision.inference_completed",
  featureCandidateDetected: "vision.feature_candidate_detected",
  hazardCandidateDetected: "vision.hazard_candidate_detected",
  geometryEstimated: "vision.geometry_estimated",
  candidateConfirmed: "vision.candidate_confirmed",
  candidateRejected: "vision.candidate_rejected",
  evidenceBundleCreated: "vision.evidence_bundle_created",
  evidenceSubmitted: "vision.evidence_submitted",
  moderationRequested: "vision.moderation_requested",
  observationCorroborated: "vision.observation_corroborated",
  evidenceVerified: "vision.evidence_verified",
  evidenceDisputed: "vision.evidence_disputed",
  evidenceExpired: "vision.evidence_expired",
  twinConflictDetected: "vision.twin_conflict_detected",
  routeImpactRequested: "vision.route_impact_requested",
  modelDeployed: "vision.model_deployed",
  modelRolledBack: "vision.model_rolled_back",
  modelSuspended: "vision.model_suspended",
  safetyIncidentCreated: "vision.safety_incident_created",
  syntheticDemoViewed: "vision.synthetic_demo_viewed",
} as const;

export type VisionAuditEventName =
  (typeof VISION_AUDIT_EVENTS)[keyof typeof VISION_AUDIT_EVENTS];

/** Safe summary metadata only — never attach raw media or OCR of plates/faces. */
export type VisionAuditSafeSummary = {
  event: VisionAuditEventName;
  sessionId?: string;
  candidateId?: string;
  capturePurpose?: string;
  deviceTier?: number;
  candidateClass?: string;
  modelVersion?: string;
  /** Explicitly exclude media references from audit payloads in Wave 1+. */
  mediaAttached: false;
};
