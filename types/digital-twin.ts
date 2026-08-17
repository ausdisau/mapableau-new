/** Re-export Digital Twin types for shared use across app and API layers. */
export type {
  AccessNeedProfile,
  TwinAssessment,
  TwinCompatibilityResult,
  TwinConsentGrant,
  TwinEvidence,
  TwinFeature,
  TwinIssue,
  TwinPathSegment,
  TwinPlace,
  TwinPlaceBundle,
  TwinZone,
  ManualAccessNeeds,
  TwinAuditEvent,
  TwinAttestation,
} from "@/lib/digital-twin/types";

export {
  createTwinPlaceSchema,
  submitEvidenceSchema,
  submitIssueSchema,
  compatibilityRequestSchema,
  consentCheckSchema,
  twinPlaceFilterSchema,
} from "@/lib/digital-twin/schema";
