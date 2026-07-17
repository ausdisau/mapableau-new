import type { WorkerCredentialInput } from "./readiness";

/** Synthetic worker for Taylor golden scenario — AAC competency incomplete without observation. */
export const taylorSupportWorker: WorkerCredentialInput = {
  workerProfileId: "fixture-taylor-worker",
  organisationId: "fixture-harbour-provider",
  displayName: "Alex (synthetic worker)",
  workerScreeningStatus: "verified",
  firstAidStatus: "verified",
  wwccStatus: "verified",
  verificationStatus: "verified",
  trustCredentials: [
    {
      credentialType: "first_aid",
      status: "verified",
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  learningEvidence: [
    {
      competencyKey: "communication_aac",
      evidenceClasses: ["course_completion"],
    },
    {
      competencyKey: "power_chair_transport",
      evidenceClasses: [],
    },
  ],
  requiredCompetencies: ["communication_aac", "power_chair_transport"],
  participantIntroductionCompleted: false,
  isSynthetic: true,
};
