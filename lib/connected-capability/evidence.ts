/**
 * Shared evidence classes for the Connected Capability Programme.
 * Do not collapse these into a single confidence score.
 */

export const EVIDENCE_CLASSES = [
  "self_declared",
  "participant_confirmed",
  "organisation_confirmed",
  "document_evidence",
  "course_completion",
  "assessment_passed",
  "supervisor_observed",
  "participant_feedback",
  "professional_verified",
  "authoritative_source",
  "expired",
  "disputed",
  "unknown",
] as const;

export type EvidenceClass = (typeof EVIDENCE_CLASSES)[number];

export interface EvidenceReference {
  class: EvidenceClass;
  source: string;
  sourceVersion?: string;
  observedAt?: string;
  expiresAt?: string | null;
  summary?: string;
  /** Fixture / synthetic data must remain labelled. */
  isSynthetic?: boolean;
}

/** Course completion alone never proves universal competency. */
export function isCompetencyProving(evidence: EvidenceReference[]): boolean {
  const active = evidence.filter(
    (e) => e.class !== "expired" && e.class !== "disputed" && e.class !== "unknown"
  );
  const hasObservation = active.some(
    (e) =>
      e.class === "supervisor_observed" || e.class === "professional_verified"
  );
  const hasAssessment = active.some((e) => e.class === "assessment_passed");
  const hasCompletion = active.some((e) => e.class === "course_completion");
  return hasCompletion && hasAssessment && hasObservation;
}

export function missingEvidenceCannotPass(
  className: EvidenceClass | undefined
): boolean {
  return !className || className === "unknown";
}
