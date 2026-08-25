import type { RelationalDecisionPassport } from "@/lib/ai/relational/contracts";
import { RELATIONAL_CONSTITUTION_VERSION } from "@/lib/ai/relational/constitution";
import { RELATIONAL_POLICY_VERSION } from "@/lib/ai/relational/types";

const NOW = "2026-08-25T00:00:00.000Z";

/** Synthetic fixtures only — no live participant data. */
export const RELATIONAL_CONTRACT_FIXTURES = {
  validSelfReport: {
    text: "I want short plain-language explanations.",
    purpose: "relational.service_assistance" as const,
    confirmationState: "participant_confirmed" as const,
    reportedAt: NOW,
    labels: [] as string[],
  },
  invalidSelfReportWithDerivedLabel: {
    text: "I am tired today.",
    purpose: "relational.service_assistance" as const,
    confirmationState: "unconfirmed" as const,
    reportedAt: NOW,
    labels: ["sad"],
  },
  validInterpretationUnconfirmed: {
    purpose: "relational.service_assistance" as const,
    fields: { helpWanted: "explain_options" },
    sourceUtteranceRef: "utt-1",
    redactedProvenance: "participant_utterance",
    assumptions: ["location inferred from prior session"],
    uncertaintyNotes: ["service type unclear"],
    nonNegotiableConstraints: ["wheelchair_access"],
    confirmationState: "unconfirmed" as const,
    revision: 0,
    previousRevisionRef: null,
  },
  invalidInterpretationWithEmotionField: {
    purpose: "relational.service_assistance" as const,
    fields: { emotion: "frustrated" },
    assumptions: [],
    uncertaintyNotes: [],
    nonNegotiableConstraints: [],
    confirmationState: "unconfirmed" as const,
    revision: 0,
  },
  validCommunicationPreference: {
    pace: "slower" as const,
    length: "short" as const,
    vocabulary: "plain" as const,
    format: "aac_compatible" as const,
    allowLongPauses: true,
    saveAndResume: true,
    sensoryPreferences: ["low_stimulation"],
    provenance: {
      source: "participant" as const,
      recordedAt: NOW,
      expiresAt: "2027-08-25T00:00:00.000Z",
      actorUserId: "participant-a",
    },
  },
  expiredCommunicationPreference: {
    pace: "standard" as const,
    allowLongPauses: true,
    saveAndResume: true,
    provenance: {
      source: "participant" as const,
      recordedAt: "2024-01-01T00:00:00.000Z",
      expiresAt: "2024-06-01T00:00:00.000Z",
      actorUserId: "participant-a",
    },
  },
  validDecisionPassport: {
    id: "passport-synth-1",
    tenantId: "tenant-a",
    participantId: "participant-a",
    actorUserId: "actor-a",
    requestSummary: "Explain nearby accessible providers",
    assistanceMode: "EXPLAIN" as const,
    approvedInterpretation: null,
    hardConstraints: ["wheelchair_access"],
    evidenceSources: [{ label: "public_directory", freshness: "fresh" as const }],
    uncertaintyNotes: ["hours may be stale"],
    suggestions: ["Ask for suburb confirmation"],
    aiInvolved: false,
    corrections: [],
    consentPurpose: "relational.service_assistance" as const,
    consentState: "granted" as const,
    nextStepOwner: "participant" as const,
    policyVersion: RELATIONAL_POLICY_VERSION,
    constitutionVersion: RELATIONAL_CONSTITUTION_VERSION,
  } satisfies RelationalDecisionPassport,
  withdrawnConsentGrant: {
    grantedPurposes: ["relational.service_assistance"],
    withdrawnPurposes: ["relational.service_assistance"],
    requiredPurpose: "relational.service_assistance" as const,
  },
  serviceDoesNotImplyTraining: {
    grantedPurposes: ["relational.service_assistance"],
    withdrawnPurposes: [] as string[],
    requiredPurpose: "relational.model_training" as const,
  },
} as const;
