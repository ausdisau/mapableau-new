import {
  CONNECTED_CAPABILITY_SOURCE_VERSION,
  type CompetencyEvidenceReference,
  type EvidenceReference,
  type LearningAssessmentReference,
  type LearningCompletionReference,
  isCompetencyProving,
} from "@/lib/connected-capability";

export interface CompletionExchangePayload {
  completion: LearningCompletionReference;
  assessment?: LearningAssessmentReference | null;
  observationEvidenceClasses?: CompetencyEvidenceReference["evidence"][number]["class"][];
  competencyKey: string;
  workerProfileId: string;
}

/**
 * Learning completion exchange contract.
 * Maps Academy completion into WorkforceOS evidence references without
 * auto-certifying competency.
 */
export function exchangeLearningCompletion(
  payload: CompletionExchangePayload
): {
  completionRef: LearningCompletionReference;
  competencyEvidence: CompetencyEvidenceReference;
  workforceBridge: {
    mayUpdateReadiness: true;
    mayAutoCertify: false;
    mayAutoAssign: false;
  };
  sourceVersion: string;
} {
  const evidence: EvidenceReference[] = [
    {
      class: "course_completion",
      source: payload.completion.provider,
      observedAt: payload.completion.completedAt,
      expiresAt: payload.completion.expiresAt,
      isSynthetic: payload.completion.isSynthetic,
    },
  ];

  if (payload.assessment?.passed) {
    evidence.push({
      class: "assessment_passed",
      source: "mapable_academy",
      observedAt: payload.assessment.assessedAt,
      expiresAt: null,
      isSynthetic: payload.assessment.isSynthetic,
    });
  }

  for (const cls of payload.observationEvidenceClasses ?? []) {
    if (cls === "supervisor_observed" || cls === "professional_verified") {
      evidence.push({
        class: cls,
        source: "authorised_assessor",
        observedAt: new Date().toISOString(),
        expiresAt: null,
      });
    }
  }

  const competencyEvidence: CompetencyEvidenceReference = {
    id: `comp-ev-${payload.completion.id}`,
    workerProfileId: payload.workerProfileId,
    competencyKey: payload.competencyKey,
    evidence,
    competencyProved: isCompetencyProving(evidence),
    expiresAt: payload.completion.expiresAt,
    humanReviewRequired: !isCompetencyProving(evidence),
  };

  return {
    completionRef: {
      ...payload.completion,
      evidenceClass: "course_completion",
    },
    competencyEvidence,
    workforceBridge: {
      mayUpdateReadiness: true,
      mayAutoCertify: false,
      mayAutoAssign: false,
    },
    sourceVersion: CONNECTED_CAPABILITY_SOURCE_VERSION,
  };
}
